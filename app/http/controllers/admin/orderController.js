const order = require('../../../models/order');

function orderController() {
    return {
        async index(req, res) {
            try {
                const orders = await order.find({ status: { $ne: 'completed' } })
                    .sort({ createdAt: -1 })
                    .populate('customerId', '-password');

                if (req.xhr) {
                    return res.json(orders);
                } else {
                    return res.render('admin/orders', { orders });
                }
            } catch (error) {
                console.error(error);
                return res.status(500).send('Internal Server Error');
            }
        }
    };
}

module.exports = orderController;
