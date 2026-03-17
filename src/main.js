/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
    const { purchase_price } = _product;
    const priceWithDiscount = sale_price * (1 - (discount / 100));
    return revenue;
}
/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    const { profit } = seller;
    let bonusPercentage;
    if (index === 0) {
        bonusPercentage = 0.15;
    } else if (index === 1 || index === 2) {
        bonusPercentage = 0.10;
    } else if (index === total - 1) {
        return 0;
    } else {
        bonusPercentage = 0.05;
    }
    const bonus = profit * bonusPercentage;
    return Math.round(bonus * 100) / 100;
}
/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data
    || !Array.isArray(data.sellers)
    || data.sellers.length === 0
    || !Array.isArray(data.products)
    || !Array.isArray(data.purchase_records)
    || data.products.length === 0
    || data.purchase_records.length === 0
    ) {
        throw new Error('Некорректные входные данные');
    }
    const { calculateRevenue, calculateBonus } = options;
    // @TODO: Проверка наличия опций
    if (!options || typeof options !== "object" || typeof calculateRevenue !== "function" || typeof calculateBonus !== "function") {
        throw new Error('Чего-то не хватает');
    }
    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        seller_id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        sales_count: 0,
        profit: 0,
        revenue: 0,
        products_sold: {}
    }));
    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = {};
    const productIndex = {};
    sellerStats.forEach(stat => {
        sellerIndex[stat.seller_id] = stat;
    });
    data.products.forEach(product => {
        productIndex[product.sku] = product;
    });
    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const sellerStat = sellerIndex[record.seller_id];
        if (!sellerStat) return;
        sellerStat.sales_count++;
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;
            const revenue = calculateRevenue(item, product);
            sellerStat.revenue += revenue;
            const cost = product.purchase_price * item.quantity;
            const profit = revenue - cost;
            sellerStat.profit += profit;
            if (!sellerStat.products_sold[item.sku]) {
                sellerStat.products_sold[item.sku] = {
                    quantity: 0,
                };
            }
            sellerStat.products_sold[item.sku].quantity += item.quantity;
        });
    });
    // @TODO: Сортировка продавцов по прибыли
    const sortedSellers = [...sellerStats].sort((a, b) => b.profit - a.profit);
    // @TODO: Назначение премий на основе ранжирования
    sortedSellers.forEach((seller, index) => {
        if (typeof calculateBonus === 'function') {
            seller.bonus = calculateBonus(index, sortedSellers.length,  { profit: seller.profit });
        }
    });
    // @TODO: Подготовка итоговой коллекции с нужными полями
    const result = sortedSellers.map(seller => {
        const topProducts = Object.entries(seller.products_sold)
            .map(([sku, data]) => ({
                sku,
                quantity: data.quantity,
            }))
            .sort((a, b) => {
                if (b.quantity !== a.quantity) {
                    return b.quantity - a.quantity;
                }
                return a.sku.localeCompare(b.sku);
            })
            .slice(0, 10);
        return {
            seller_id: seller.seller_id,
            name: seller.name,
            revenue: Math.round(seller.revenue * 100) / 100,
            profit: Math.round(seller.profit * 100) / 100,
            sales_count: seller.sales_count,
            top_products: topProducts,
            bonus: seller.bonus
        };
    });
    return result;
}
