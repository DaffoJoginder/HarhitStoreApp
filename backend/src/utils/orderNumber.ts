export const generateOrderNumber = (orderType: 'b2c' | 'b2b'): string => {
  const prefix = orderType === 'b2c' ? 'ORD' : 'B2B';
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${prefix}${date}${random}`;
};

