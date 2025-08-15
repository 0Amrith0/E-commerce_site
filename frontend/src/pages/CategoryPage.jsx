import React from 'react'
import { useEffect } from 'react';
import { useProductStore } from '../stores/useProductStore'

const CategoryPage = () => {

    const { fetchProductsByCategory, products } = useProductStore();

    useEffect(() => {
        fetchProductsByCategory("shoe")
    }, [fetchProductsByCategory])
  return (
    <div>CategoryPage</div>
  )
}

export default CategoryPage