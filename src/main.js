/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    const { discount, sale_price, quantity } = purchase;
    const priceWithDiscount = sale_price * (1 - (discount / 100));
    const revenue = priceWithDiscount * quantity;
    return Math.round(revenue * 100) / 100;
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
    // Проверка входных данных
    if (!data) throw new Error('Некорректные входные данные');
    if (!Array.isArray(data.sellers)) throw new Error('Некорректные входные данные');
    if (!Array.isArray(data.products)) throw new Error('Некорректные входные данные');
    if (!Array.isArray(data.purchase_records)) throw new Error('Некорректные входные данные');
    if (data.sellers.length === 0) throw new Error('Некорректные входные данные');
    if (data.products.length === 0) throw new Error('Некорректные входные данные');
    if (data.purchase_records.length === 0) throw new Error('Некорректные входные данные');
    
    // Проверка опций
    if (!options || typeof options !== 'object') throw new Error('Чего-то не хватает');
    if (typeof options.calculateRevenue !== 'function') throw new Error('Чего-то не хватает');
    if (typeof options.calculateBonus !== 'function') throw new Error('Чего-то не хватает');
    
    const { calculateRevenue, calculateBonus } = options;

    // Создаем индексы для быстрого доступа
    const productMap = {};
    data.products.forEach(p => productMap[p.sku] = p);
    
    // Инициализируем статистику продавцов
    const sellerStats = {};
    data.sellers.forEach(seller => {
        sellerStats[seller.id] = {
            seller_id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            sales_count: 0,
            revenue: 0,
            profit: 0,
            products: {}
        };
    });

    // Обрабатываем чеки
    data.purchase_records.forEach(record => {
        const seller = sellerStats[record.seller_id];
        if (!seller) return;
        
        seller.sales_count++;
        
        record.items.forEach(item => {
            const product = productMap[item.sku];
            if (!product) return;
            
            // Расчет выручки
            const revenue = calculateRevenue(item, product);
            seller.revenue += revenue;
            
            // Расчет прибыли (выручка минус себестоимость)
            const cost = product.purchase_price * item.quantity;
            seller.profit += revenue - cost;
            
            // Учет проданных товаров
            if (!seller.products[item.sku]) {
                seller.products[item.sku] = 0;
            }
            seller.products[item.sku] += item.quantity;
        });
    });

    // Преобразуем в массив и сортируем по прибыли
    const sellersArray = Object.values(sellerStats).sort((a, b) => b.profit - a.profit);

    // Рассчитываем бонусы
    sellersArray.forEach((seller, index) => {
        seller.bonus = calculateBonus(index, sellersArray.length, { profit: seller.profit });
    });

    // Формируем результат
    const result = sellersArray.map(seller => {
        // Топ-10 товаров по количеству
        const topProducts = Object.entries(seller.products)
            .map(([sku, quantity]) => ({
                sku: sku,
                quantity: quantity
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
