export function getDayGreeting(date: Date = new Date()) {
  const hour = date.getHours();
  return hour >= 18 || hour < 6 ? 'Bonsoir' : 'Bonjour';
}
