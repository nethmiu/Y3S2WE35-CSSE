const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @desc    Create a stripe payment intent
// @route   POST /api/payments/create-payment-intent
const createPaymentIntent = async (req, res) => {
    const { amount } = req.body;

    if (!amount) {
        return res.status(400).json({ message: 'Amount is required' });
    }

    try {
        // Payment Intent එකක් Stripe හි නිර්මාණය කිරීම
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount, // මුදල smallest currency unit එකෙන් දිය යුතුය (e.g., LKR 500 = 50000)
            currency: 'lkr',
            payment_method_types: ['card'],
        });

        // client_secret එක frontend එකට නැවත යැවීම
        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createPaymentIntent };