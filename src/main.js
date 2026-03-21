/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
    let revenue = sale_price * (1 - (discount / 100)) * quantity;
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
        bonusPercentage = 0;
    } else {
        bonusPercentage = 0.05;
    }
    return profit * bonusPercentage;
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
    const sellerIndex = Object.fromEntries(
        sellerStats.map(item => [item.seller_id, item])
    );
    const productIndex = Object.fromEntries(
        data.products.map(item => [item.sku, item])
    );
    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => {
        const seller = sellerIndex[record.seller_id];
        seller.sales_count++;
        seller.revenue += record.total_amount;
        record.items.forEach(item => {
            const product = productIndex[item.sku];
            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item, product);
            const profit = revenue - cost;
            seller.profit += profit;
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });
    // @TODO: Сортировка продавцов по прибыли
    sellerStats.sort((a, b) => b.profit - a.profit);
    // @TODO: Назначение премий на основе ранжирования
    sellerStats.forEach((seller, index) => {
            seller.bonus = calculateBonus(index, sellerStats.length, seller);
            seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({
                sku,
                quantity,
            }))
            .sort((a, b) =>  b.quantity - a.quantity)
            .slice(0, 10);
    });
    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.seller_id,
        name: seller.name,
        revenue: Math.round(seller.revenue * 100) / 100,
        profit: Math.round(seller.profit * 100) / 100,
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: Math.round(seller.bonus * 100) / 100
    }));
    
}
