// Where the calls to action go. Set TELEGRAM_URL once the production bot exists;
// while it is empty the Telegram links are left out of the page.
export const APP_URL = 'https://app.smetase.com'
export const TELEGRAM_URL = ''
export const PARTNERS_EMAIL = 'partners@smetase.com'
export const HELLO_EMAIL = 'hello@smetase.com'

// Social profiles. Icons show now; add each URL when the account exists and the icon becomes a link.
export const SOCIALS = [
  { name: 'Instagram', icon: 'instagram', url: '' },
  { name: 'X', icon: 'x', url: '' },
  { name: 'TikTok', icon: 'tiktok', url: '' },
  { name: 'YouTube', icon: 'youtube', url: '' },
  { name: 'WhatsApp', icon: 'whatsapp', url: '' },
  { name: 'Telegram', icon: 'telegram', url: TELEGRAM_URL },
]

// Nigerian airports the departures board leaves from. Rows start on different ones and keep
// rotating, so the board is about the whole country, not one city.
export const ORIGINS = ['LOS', 'ABV', 'KAN', 'PHC', 'ENU', 'QOW', 'ILR', 'KAD', 'BNI', 'JOS']

// Destinations on the departures board. `status` is what the board says for each one:
// keep it true to what Smetase can actually handle today.
export const DESTINATIONS = [
  { flag: 'gb', country: 'United Kingdom', airport: 'LHR', status: 'Boarding' },
  { flag: 'ie', country: 'Ireland', airport: 'DUB', status: 'Next' },
  { flag: 'ca', country: 'Canada', airport: 'YYZ', status: 'Next' },
  { flag: 'us', country: 'United States', airport: 'JFK', status: 'Later' },
  { flag: 'de', country: 'Germany', airport: 'BER', status: 'Later' },
  { flag: 'nl', country: 'Netherlands', airport: 'AMS', status: 'Later' },
  { flag: 'au', country: 'Australia', airport: 'MEL', status: 'Later' },
]
