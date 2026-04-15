const supabase  = require('../config/supabase')
const { v4: uuidv4 } = require('uuid')

// Vérifier les mots interdits
async function checkForbiddenWords(text) {
  const { data: words } = await supabase.from('forbidden_words').select('word')
  if (!words) return false
  const lower = text.toLowerCase()
  return words.some(({ word }) => lower.includes(word.toLowerCase()))
}

exports.getListings = async (req, res) => {
  try {
    const {
      category_id, condition, min_price, max_price,
      brand, is_urgent, lat, lon, distance,
      page = 1, limit = 20, sort = 'recent'
    } = req.query

    let query = supabase
      .from('listings')
      .select(`
        *,
        profiles:user_id (id, username, avatar_url, city, postal_code),
        categories:category_id (id, name, slug),
        listing_images (url, sort_order),
        listing_brands (brand_name, brands:brand_id (name))
      `)
      .eq('status', 'active')
      .not('profiles', 'is', null) // exclure les annonces dont le propriétaire est supprimé

    // Ne pas montrer ses propres annonces sur la page principale
    if (req.user?.id) query = query.neq('user_id', req.user.id)

    if (category_id) query = query.eq('category_id', category_id)
    if (is_urgent === 'true') query = query.eq('is_urgent', true)
    if (min_price) query = query.gte('price_max', min_price)
    if (max_price) query = query.lte('price_min', max_price)

    // Tri
    if (sort === 'recent') query = query.order('created_at', { ascending: false })
    else if (sort === 'price_asc') query = query.order('price_min', { ascending: true })
    else if (sort === 'price_desc') query = query.order('price_max', { ascending: false })
    else if (sort === 'urgent') query = query.order('is_urgent', { ascending: false }).order('created_at', { ascending: false })

    const offset = (parseInt(page) - 1) * parseInt(limit)
    query = query.range(offset, offset + parseInt(limit) - 1)

    const { data, error, count } = await query
    if (error) throw error

    // Filtrage par distance côté JS (si coordonnées fournies)
    let listings = data || []
    if (lat && lon && distance) {
      const userLat = parseFloat(lat)
      const userLon = parseFloat(lon)
      const maxDist = parseFloat(distance)
      listings = listings.filter(l => {
        if (!l.latitude || !l.longitude) return true
        const d = distanceKm(userLat, userLon, l.latitude, l.longitude)
        return d <= Math.min(maxDist, l.max_distance_km)
      })
    }

    res.json({ data: listings, page: parseInt(page), limit: parseInt(limit) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur lors de la récupération des annonces' })
  }
}

exports.searchListings = async (req, res) => {
  try {
    const { q, ...filters } = req.query

    let query = supabase
      .from('listings')
      .select(`
        *,
        profiles:user_id (id, username, avatar_url, city, postal_code),
        categories:category_id (id, name, slug),
        listing_images (url, sort_order)
      `)
      .eq('status', 'active')
      .not('profiles', 'is', null)
      .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (req.user?.id) query = query.neq('user_id', req.user.id)

    const { data, error } = await query
    if (error) throw error
    res.json({ data: data || [] })
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la recherche' })
  }
}

exports.getListing = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        profiles:user_id (id, username, avatar_url, city, postal_code, region, created_at),
        categories:category_id (id, name, slug),
        listing_images (id, url, sort_order),
        listing_brands (brand_name, brands:brand_id (name))
      `)
      .eq('id', id)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Annonce introuvable' })

    // Incrémenter le compteur de vues
    await supabase.from('listings').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id)

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.getUserListings = async (req, res) => {
  try {
    const { userId } = req.params
    const { status = 'active' } = req.query

    const { data, error } = await supabase
      .from('listings')
      .select(`*, listing_images (url, sort_order), categories:category_id (name)`)
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ data: data || [] })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.getMyListings = async (req, res) => {
  try {
    const { status } = req.query

    let query = supabase
      .from('listings')
      .select(`*, listing_images (url, sort_order), categories:category_id (name)`)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    res.json({ data: data || [] })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.createListing = async (req, res) => {
  try {
    const {
      title, description, category_id, price_min, price_max,
      max_distance_km, conditions, is_urgent, brands
    } = req.body

    // Vérifier mots interdits
    const textToCheck = `${title} ${description || ''}`
    if (await checkForbiddenWords(textToCheck)) {
      return res.status(400).json({ error: 'Votre annonce contient des mots non autorisés' })
    }

    if (price_min > price_max) {
      return res.status(400).json({ error: 'Le prix minimum doit être inférieur au prix maximum' })
    }

    // Récupérer la localisation du profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('city, postal_code, region, latitude, longitude')
      .eq('id', req.user.id)
      .single()

    const { data: listing, error } = await supabase
      .from('listings')
      .insert({
        user_id: req.user.id,
        category_id,
        title,
        description,
        price_min: parseFloat(price_min),
        price_max: parseFloat(price_max),
        max_distance_km: parseInt(max_distance_km),
        conditions,
        is_urgent: is_urgent || false,
        city: profile?.city,
        postal_code: profile?.postal_code,
        region: profile?.region,
        latitude: profile?.latitude,
        longitude: profile?.longitude
      })
      .select()
      .single()

    if (error) throw error

    // Ajouter les marques
    if (brands && brands.length > 0) {
      const brandInserts = brands.map(b => ({
        listing_id: listing.id,
        brand_id: b.id || null,
        brand_name: b.name || null
      }))
      await supabase.from('listing_brands').insert(brandInserts)
    }

    res.status(201).json(listing)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur lors de la création de l\'annonce' })
  }
}

exports.updateListing = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    // Vérifier propriétaire
    const { data: existing } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing) return res.status(404).json({ error: 'Annonce introuvable' })
    if (existing.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    if (updates.title || updates.description) {
      const textToCheck = `${updates.title || ''} ${updates.description || ''}`
      if (await checkForbiddenWords(textToCheck)) {
        return res.status(400).json({ error: 'Contenu non autorisé' })
      }
    }

    const allowedFields = ['title', 'description', 'category_id', 'price_min', 'price_max', 'max_distance_km', 'conditions', 'is_urgent']
    const filtered = Object.fromEntries(Object.entries(updates).filter(([k]) => allowedFields.includes(k)))

    const { data, error } = await supabase
      .from('listings')
      .update(filtered)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const { data: existing } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing) return res.status(404).json({ error: 'Annonce introuvable' })
    if (existing.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    const { data, error } = await supabase
      .from('listings')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

exports.deleteListing = async (req, res) => {
  try {
    const { id } = req.params

    const { data: existing } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!existing) return res.status(404).json({ error: 'Annonce introuvable' })
    if (existing.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    // Suppression réelle (cascade sur images, conversations, messages via FK)
    const { error } = await supabase.from('listings').delete().eq('id', id)
    if (error) throw error

    res.json({ message: 'Annonce supprimée définitivement' })
  } catch (err) {
    console.error('deleteListing error:', err)
    res.status(500).json({ error: 'Erreur lors de la suppression' })
  }
}

exports.uploadImages = async (req, res) => {
  try {
    const { id } = req.params
    const { images } = req.body // tableau de { base64, filename }

    // Vérifier propriétaire
    const { data: listing } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!listing || listing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    const uploaded = []
    for (let i = 0; i < images.length; i++) {
      const { base64, filename } = images[i]
      const buffer = Buffer.from(base64, 'base64')
      const path = `listings/${id}/${uuidv4()}-${filename}`

      const { error: uploadError } = await supabase.storage
        .from('wantit-images')
        .upload(path, buffer, { contentType: 'image/jpeg', upsert: false })

      if (uploadError) continue

      const { data: { publicUrl } } = supabase.storage
        .from('wantit-images')
        .getPublicUrl(path)

      const { data: img } = await supabase
        .from('listing_images')
        .insert({ listing_id: id, url: publicUrl, sort_order: i })
        .select()
        .single()

      uploaded.push(img)
    }

    res.json({ images: uploaded })
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l\'upload' })
  }
}

exports.deleteImage = async (req, res) => {
  try {
    const { id, imageId } = req.params

    const { data: listing } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!listing || listing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    await supabase.from('listing_images').delete().eq('id', imageId).eq('listing_id', id)
    res.json({ message: 'Image supprimée' })
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' })
  }
}

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
function toRad(deg) { return deg * Math.PI / 180 }
