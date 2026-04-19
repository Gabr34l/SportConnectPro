/**
 * Utility functions for formatting and data manipulation
 */

export const maskCNPJ = (val: string) => {
  return val.replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

export const maskCEP = (val: string) => {
  return val.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);
};

export const maskPhone = (val: string) => {
  return val.replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/g, '($1) $2')
    .replace(/(\d)(\d{4})$/, '$1-$2')
    .substring(0, 15);
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

export const formatTime = (timeString: string) => {
  return timeString.substring(0, 5); // Assumes HH:MM:SS or HH:MM
};
