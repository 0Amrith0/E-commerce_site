import Product from "../models/product.model.js";


export const addToCart = async (req, res) => {
    try {
        const {productId} = req.body;
        const user = req.user

        const existingItem = user.cartItems.find(item => item.product.toString() === productId)

        if (existingItem){
            existingItem.quantity += 1
        } else {
            user.cartItems.push({product: productId, quantity: 1})
        }

        await user.save();

        res.json(user.cartItems)

    } catch (error) {
        console.error("Error in addToCart controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getCartProducts = async (req, res) => {
    try {
    const products = await Product.find({ _id: {$in : req.user.cartItems}})

    const cartItems = products.map(product => {
        const item = req.user.cartItems.find(cartItem => cartItem.id === product.id);
        return {...product.toJSON(), quantity:item.quantity}
    })

    res.json(cartItems)

    } catch (error) {
    console.error("Error in getCartProducts controller", error);
    res.status(500).json({ message: "Internal server error" });
}
}

export const removeAllFromCart = async (req, res) => {
    try {
        const {productId} = req.body;
        const user = req.user;

        const existingItem = user.cartItems.find(
            item => item.product.toString() === productId)

        if(!existingItem){
            return res.status(400).json({message : "Product not found"})
        }

        user.cartItems = user.cartItems.filter(
            (item) => item.product.toString() !== productId);

        await user.save();

        res.json(user.cartItems);

    } catch (error) {
        console.error("Error in removeAllFromCart controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const updateQuantity = async (req, res) => { 
    try {
        const {id:productId} = req.params;
        const {quantity} = req.body;
        const user = req.user;

        const existingItem = user.cartItems.find(item => item.product.toString() !== productId)

        if(existingItem){
            if(quantity === 0){
                user.cartItems = user.cartItems.filter((item) => item.id === productId);
                await user.save();
                return res.json(user.cartItems);
            } 

            existingItem.quantity = quantity;
            await user.save();
            return res.json(cartItems);

        } else {
            return res.status(404).json({message : "Product ot found"})
        }
    } catch (error) {
        console.error("Error in updateQuantity controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


