const express = require('express')
const router  = express.Router()

// Liste statique de marques connues (pas de DB requise)
const BRANDS = [
  // Tech / Électronique
  'Apple', 'Samsung', 'Sony', 'LG', 'Panasonic', 'Philips', 'Bosch', 'Xiaomi',
  'Huawei', 'OnePlus', 'Nokia', 'Motorola', 'Asus', 'Lenovo', 'Acer', 'Dell',
  'HP', 'Toshiba', 'Sharp', 'HTC', 'Oppo', 'Realme', 'Vivo', 'Google', 'Microsoft',
  'Intel', 'AMD', 'Nvidia', 'Razer', 'Logitech', 'SteelSeries', 'Corsair',
  'Western Digital', 'Seagate', 'Kingston', 'SanDisk', 'Crucial', 'Adata',
  'Jabra', 'Plantronics', 'Anker', 'Belkin', 'TP-Link', 'Netgear', 'Linksys',
  'Canon', 'Nikon', 'Fujifilm', 'Olympus', 'Leica', 'Pentax', 'GoPro', 'DJI',
  'Garmin', 'Fitbit', 'Polar', 'Withings', 'Suunto',

  // Audio
  'Bose', 'Beats', 'Sennheiser', 'AKG', 'Audio-Technica', 'JBL', 'Harman Kardon',
  'Marshall', 'Beyerdynamic', 'Shure', 'Bang & Olufsen', 'Denon', 'Yamaha Audio',
  'Pioneer', 'Technics', 'Sonos', 'Bowers & Wilkins', 'KEF', 'Focal',

  // Électroménager
  'Dyson', 'iRobot', 'Miele', 'Siemens', 'Brandt', 'Whirlpool', 'Electrolux',
  'Tefal', 'Moulinex', 'SEB', 'De\'Longhi', 'Nespresso', 'Krups', 'KitchenAid',
  'Kenwood', 'Cuisinart', 'Rowenta', 'Stihl', 'Black & Decker', 'Makita',
  'DeWalt', 'Bosch Outillage', 'Karcher', 'Ryobi',

  // Mode / Vêtements
  'Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance', 'Converse', 'Vans',
  'Under Armour', 'FILA', 'Ellesse', 'Champion', 'The North Face', 'Columbia',
  'Patagonia', 'Moncler', 'Canada Goose', 'Arc\'teryx', 'Salomon', 'Quiksilver',
  'Billabong', 'Roxy', 'Zara', 'H&M', 'Uniqlo', 'Bershka', 'Pull&Bear', 'Mango',
  'ASOS', 'Primark', 'Gap', 'Levi\'s', 'Lee', 'Wrangler', 'Calvin Klein',
  'Tommy Hilfiger', 'Ralph Lauren', 'Lacoste', 'Fred Perry', 'Hugo Boss',
  'Armani', 'Versace', 'Gucci', 'Louis Vuitton', 'Chanel', 'Prada', 'Dior',
  'Hermès', 'Burberry', 'Givenchy', 'Balenciaga', 'Off-White', 'Supreme',
  'Stone Island', 'CP Company', 'Ami Paris', 'Jacquemus',

  // Chaussures
  'Timberland', 'UGG', 'Crocs', 'Birkenstock', 'Dr. Martens', 'Clarks',
  'Geox', 'Ecco', 'Skechers', 'Asics', 'Brooks', 'Hoka', 'On Running',
  'Salewa', 'Merrell', 'Keen', 'Vibram',

  // Luxe / Accessoires
  'Rolex', 'Omega', 'TAG Heuer', 'Longines', 'Tissot', 'Casio', 'Seiko',
  'Citizen', 'Fossil', 'Michael Kors', 'Coach', 'Kate Spade', 'Tory Burch',
  'Ray-Ban', 'Oakley', 'Persol', 'Cartier',

  // Sport & Outdoor
  'Décathlon', 'Rossignol', 'Head', 'Wilson', 'Babolat', 'Yonex', 'Prince',
  'Callaway', 'Titleist', 'TaylorMade', 'Ping', 'Mizuno', 'Cobra', 'Cleveland',
  'Specialized', 'Trek', 'Scott', 'Giant', 'Cannondale', 'Cube', 'Merida',
  'BMC', 'Look', 'Colnago', 'Pinarello',

  // Automobile
  'BMW', 'Mercedes-Benz', 'Volkswagen', 'Toyota', 'Honda', 'Ford', 'Audi',
  'Renault', 'Peugeot', 'Citroën', 'Fiat', 'Volvo', 'Porsche', 'Ferrari',
  'Lamborghini', 'Bentley', 'Rolls-Royce', 'Tesla', 'Nissan', 'Hyundai',
  'Kia', 'Mazda', 'Subaru', 'Jeep', 'Land Rover', 'Range Rover', 'Jaguar',
  'Lexus', 'Infiniti', 'Acura', 'Genesis', 'Alfa Romeo', 'Maserati', 'Dodge',
  'Chevrolet', 'Cadillac', 'Buick', 'Seat', 'Skoda', 'Opel', 'Dacia',
  'Mitsubishi', 'Suzuki', 'Isuzu',

  // Moto
  'Harley-Davidson', 'Yamaha Moto', 'Honda Moto', 'Kawasaki', 'Suzuki Moto',
  'Ducati', 'KTM', 'BMW Motorrad', 'Triumph', 'Royal Enfield', 'Aprilia',

  // Beauté / Cosmétiques
  'L\'Oréal', 'Maybelline', 'NYX', 'MAC', 'NARS', 'Urban Decay', 'Benefit',
  'Too Faced', 'Charlotte Tilbury', 'Fenty Beauty', 'Anastasia Beverly Hills',
  'Clinique', 'Estée Lauder', 'Lancôme', 'Dior Beauty', 'YSL Beauty',
  'Chanel Beauty', 'Givenchy Beauty', 'Kiehl\'s', 'The Ordinary', 'CeraVe',
  'Neutrogena', 'Garnier', 'Nivea', 'Dove',

  // Gaming
  'Nintendo', 'PlayStation', 'Xbox', 'Sega', 'Atari', 'Valve',

  // Mobilier / Maison
  'IKEA', 'Maisons du Monde', 'Habitat', 'Roche Bobois', 'Ligne Roset',
  'Conforama', 'But', 'Fly', 'Alinéa',

  // Livres / Médias
  'Hachette', 'Gallimard', 'Flammarion', 'Penguin', 'Larousse',

  // Jouets
  'LEGO', 'Playmobil', 'Mattel', 'Hasbro', 'Fisher-Price', 'Hot Wheels',
  'Barbie', 'Schleich', 'Brio', 'Ravensburger',

  // Instruments de musique
  'Gibson', 'Fender', 'Roland', 'Steinway', 'Yamaha Music', 'Casio Music',
  'Korg', 'Moog', 'Martin', 'Taylor', 'Ibanez', 'ESP', 'Jackson', 'Paul Reed Smith',
  'Rickenbacker', 'Gretsch', 'Zildjian', 'Meinl', 'Pearl', 'DW',

  // Bagagerie / Voyage
  'Samsonite', 'American Tourister', 'Delsey', 'Rimowa', 'Tumi', 'Away',
  'Osprey', 'Deuter', 'Fjällräven',
].sort()

// Recherche de marques (auto-complétion depuis liste statique)
router.get('/search', (req, res) => {
  const { q } = req.query
  if (!q || q.length < 2) return res.json({ data: [] })

  const query = q.toLowerCase()
  const results = BRANDS
    .filter(b => b.toLowerCase().includes(query))
    .slice(0, 10)
    .map((name, i) => ({ id: `static-${i}`, name }))

  res.json({ data: results })
})

module.exports = router
