const midtransClient = require('midtrans-client');
const crypto = require('crypto');
const Payment = require('../model/PaymentModel');
const Booking = require('../model/BookingModel'); 

// Inisialisasi Midtrans Snap
const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY
});

// Inisialisasi Core API untuk check status
const coreApi = new midtransClient.CoreApi({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    serverKey: process.env.MIDTRANS_SERVER_KEY
});

exports.createPayment = async (req, res) => {
    try {
        // Flutter HANYA perlu mengirim bookingId
        const { bookingId } = req.body;

        if (!bookingId) {
            return res.status(400).json({ success: false, message: "bookingId wajib diisi" });
        }

        // 1. Cari data Booking di database (sekaligus ambil data usernya)
        const booking = await Booking.findById(bookingId).populate('userId');
        
        if (!booking) {
            return res.status(404).json({ success: false, message: "Data Booking tidak ditemukan" });
        }

        // Validasi: Customer hanya bisa membayar booking miliknya sendiri
        if (req.user.role === 'pelanggan' && booking.userId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Anda hanya bisa membayar booking milik Anda sendiri" });
        }

        // 2. Cegah double payment: Cek apakah sudah ada payment yang sukses/pending untuk booking ini
        const existingPayment = await Payment.findOne({
            bookingId: bookingId,
            transactionStatus: { $in: ['pending', 'settlement'] }
        });

        if (existingPayment) {
            // Jika sudah ada token yang pending, kembalikan token yang lama (biar user bisa lanjut bayar)
            if (existingPayment.transactionStatus === 'pending') {
                return res.status(200).json({
                    success: true,
                    message: "Gunakan tagihan yang sudah ada",
                    token: existingPayment.snapToken,
                    redirect_url: existingPayment.snapRedirectUrl
                });
            }
            return res.status(400).json({ success: false, message: "Booking ini sudah lunas!" });
        }

        // 3. Ambil Harga ASLI dari database, BUKAN dari Flutter
        const grossAmount = booking.totalPrice;

        // 4. Buat order_id unik untuk Midtrans
        const orderId = `SPEEDLAB-${booking._id}-${Date.now()}`;

        // 5. Siapkan parameter Midtrans
        const parameter = {
            "transaction_details": {
                "order_id": orderId, 
                "gross_amount": grossAmount
            },
            "customer_details": {
                // Asumsi di model User Anda ada field 'name' dan 'email'
                "first_name": booking.userId.name || "Pelanggan Speedlab",
                "email": booking.userId.email || "pelanggan@speedlab.com"
            }
        };

        // 6. Tembak ke API Midtrans untuk mendapatkan Token
        const transaction = await snap.createTransaction(parameter);

        // 7. Simpan riwayat Payment ini ke MongoDB
        const newPayment = new Payment({
            bookingId: booking._id,
            userId: booking.userId._id, // Relasi ke user yang membooking
            orderId: orderId,
            grossAmount: grossAmount,
            snapToken: transaction.token,
            snapRedirectUrl: transaction.redirect_url,
            transactionStatus: 'pending' // Status awal
        });
        await newPayment.save();

        // 8. Kirim URL pembayaran kembali ke Flutter
        res.status(200).json({
            success: true,
            token: transaction.token,
            redirect_url: transaction.redirect_url
        });

    } catch (error) {
        console.error("Midtrans Error:", error);
        res.status(500).json({ success: false, message: "Gagal memproses pembayaran" });
    }
};


exports.handleWebhook = async (req, res) => {
    try {
        // Validasi signature dari Midtrans untuk keamanan
        const { order_id, status_code, gross_amount, signature_key } = req.body;
        const serverKey = process.env.MIDTRANS_SERVER_KEY;
        const hash = crypto.createHash('sha512').update(`${order_id}${status_code}${gross_amount}${serverKey}`).digest('hex');
        
        if (signature_key !== hash) {
            return res.status(401).json({ message: "Invalid signature" });
        }

        const notification = await snap.transaction.notification(req.body);

        const orderId = notification.order_id;
        const transactionStatus = notification.transaction_status;
        const fraudStatus = notification.fraud_status;

        // Cari data payment di database berdasarkan orderId dari Midtrans
        const payment = await Payment.findOne({ orderId: orderId });
        if (!payment) {
            return res.status(404).json({ message: "Payment tidak ditemukan" });
        }

        // Logika penentuan status
        if (transactionStatus == 'capture' || transactionStatus == 'settlement') {
            if (fraudStatus == 'challenge') {
                payment.transactionStatus = 'pending';
            } else if (fraudStatus == 'accept' || !fraudStatus) {
                payment.transactionStatus = 'settlement'; // LUNAS!
                
                // UPDATE JUGA STATUS BOOKING OTOMATIS JADI TERVERIFIKASI
                await Booking.findByIdAndUpdate(payment.bookingId, {
                    status: 'Terverifikasi'
                });
            }
        } else if (transactionStatus == 'cancel' || transactionStatus == 'deny' || transactionStatus == 'expire') {
            payment.transactionStatus = transactionStatus; // Batal/Kadaluarsa
        } else if (transactionStatus == 'pending') {
            payment.transactionStatus = 'pending';
        }

        // Simpan tipe pembayaran (misal: bank_transfer, gopay)
        payment.paymentType = notification.payment_type;
        await payment.save();

        res.status(200).json({ status: "OK" }); // Wajib balas 200 OK ke Midtrans

    } catch (error) {
        console.error("Webhook Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Check Payment Status (untuk customer refresh status di app)
exports.checkPaymentStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;

        // Cari payment berdasarkan bookingId
        const payment = await Payment.findOne({ bookingId })
            .populate('bookingId')
            .populate('userId', 'name email');

        if (!payment) {
            return res.status(404).json({ 
                success: false, 
                message: "Payment tidak ditemukan" 
            });
        }

        // Validasi: Customer hanya bisa cek payment miliknya sendiri
        if (req.user.role === 'pelanggan' && payment.userId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: "Anda hanya bisa melihat payment milik Anda sendiri" 
            });
        }

        // Ambil status terbaru dari Midtrans
        try {
            const statusResponse = await coreApi.transaction.status(payment.orderId);
            
            // Update status di database jika ada perubahan
            if (statusResponse.transaction_status !== payment.transactionStatus) {
                payment.transactionStatus = statusResponse.transaction_status;
                payment.paymentType = statusResponse.payment_type || payment.paymentType;
                await payment.save();

                // Update booking status jika payment settlement
                if (statusResponse.transaction_status === 'settlement') {
                    await Booking.findByIdAndUpdate(payment.bookingId, {
                        status: 'Terverifikasi'
                    });
                }
            }
        } catch (midtransError) {
            console.error('Error fetching from Midtrans:', midtransError);
            // Tetap return data dari database jika Midtrans error
        }

        res.status(200).json({
            success: true,
            data: {
                orderId: payment.orderId,
                bookingId: payment.bookingId._id,
                grossAmount: payment.grossAmount,
                transactionStatus: payment.transactionStatus,
                paymentType: payment.paymentType,
                snapToken: payment.snapToken,
                snapRedirectUrl: payment.snapRedirectUrl,
                createdAt: payment.createdAt,
                updatedAt: payment.updatedAt
            }
        });

    } catch (error) {
        console.error("Check Payment Status Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Gagal mengecek status pembayaran" 
        });
    }
};

// Get Payment History (untuk customer lihat riwayat pembayaran)
exports.getPaymentHistory = async (req, res) => {
    try {
        let query = {};

        // Optional: Filter berdasarkan bookingId jika disediakan
        if (req.query.bookingId) {
            query.bookingId = req.query.bookingId;
        }

        // Jika customer, hanya tampilkan payment miliknya
        if (req.user.role === 'pelanggan') {
            query.userId = req.user._id;
        }
        // Admin bisa lihat semua payment history

        const payments = await Payment.find(query)
            .populate('bookingId', 'bookingDate bookingTime status totalPrice')
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: payments.length,
            data: payments
        });

    } catch (error) {
        console.error("Get Payment History Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Gagal mengambil riwayat pembayaran" 
        });
    }
};