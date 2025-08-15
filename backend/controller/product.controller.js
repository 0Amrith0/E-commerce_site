import redis from "../lib/redis.js";
import Product from "../models/product.model.js"
import cloudinary from "../lib/cloudinary.js";

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({})
        res.status(200).json({products})
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getFeaturedProducts = async (req, res) => {
    try {
        let featuredproducts = await redis.get("featured_products");
        if (featuredproducts){
            return res.json(JSON.parse(featuredproducts))
        }

        featuredproducts = await Product.find({isFeatured : True}).lean()

        if(!featuredproducts){
            return res.status(404).json({message : "No featured products found"})
        }

        await redis.set("featured_products", JSON.parse(featuredproducts));

        res.json(featuredproducts);

    } catch (error) {
        console.error("Error fetching featured products:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const createProduct = async (req, res) => {
    try {
        const {name, description, price, image, category} = req.body;

        let cloudinaryResponse = null;

        if(image){
            cloudinaryResponse = await cloudinary.uploader.upload(image, {folder: "products"})
        }

        const product = await Product.create({
            name,
            description,
            price,
            image: cloudinaryResponse ? cloudinaryResponse.secure_url : null,
            category
        })

        res.status(201).json({message: "Product created successfully", product});
    } catch (error) {
        console.error("Error creatProduct controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if(!product){
            return res.status(404).json({message: "Product not found"});
        }

        if(product.image){
            const publicId = product.image.split("/").pop().split(".")[0];
            try {
                await cloudinary.uploader.destroy(`prodcuts/${publicId}`)
                console.log("Image deleted successfully from Cloudinary");
            } catch (error) {
                
            }
        }
        await Product.findByIdAndDelete(req.params.id);
        res.status(200).json({message: "Product deleted successfully"});

    } catch (error) {
        console.error("Error deleteProduct controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getRecommendedProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
            {
                $sample : {size : 3}
            }, 
            {
                $project: {
                    name: 1,
                    description: 1,
                    price: 1,
                    image: 1,
                    category: 1
                }
            }
        ])

        res.json(products);

    } catch (error) {
        console.error("Error in getRecommendedProducts controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getProductsByCategory = async (req, res) => {
    const {category} = req.params;

    try {

        const product = await Product.find({category});

        res.json({product});

    } catch (error) {
        console.error("Error in getProductsByCategory controller", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
        if(product){
            product.isFeatured = !product.isFeatured;
            const updatedProduct = await product.save();
            await updateFeaturedProductCache();
            res.json(updatedProduct);
        }else {
            res.status(404).json({message : "Product not found"})
        }

    } catch (error) {
        console.error("Error in toggleFeaturedProduct controller", error);
        res.status(500).json({ message: "Internal server error" }); 
    }
}

async function updateFeaturedProductCache () {
    try {
        const featuerdProducts = await Product.find({isFeatured: true}).lean()
        await redis.set("featured_products", JSON.stringify(featuerdProducts));
        console.log("Featured products cache updated successfully");
    } catch (error) {
        console.error("Error update cache function:", error);
    }
}