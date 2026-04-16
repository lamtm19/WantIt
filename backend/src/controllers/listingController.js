const supabase  = require('../config/supabase')
const { v4: uuidv4 } = require('uuid')


exports.getListings = async (req, res) => {
  try {
    const {
      category_id, condition, min_price, max_price,
      brand, is_urgent, distance,
      page = 1, limit = 20, sort = 'recent'
    } = req.query

    let lat = req.query.lat
    let lon = req.query.lon

    let query = supabase
      .from('listings')
      .select(`
        *,
        profiles:user_id (id, username, avatar_url, city, postal_code),
        categories:category_id (id, name, slug),
        listing_images (url, sort_order),
        listing_brands (brand_name)
      `)
      .eq('status', 'active')
      .not('profiles', 'is', null) // exclure les annonces dont le propriétaire est supprimé

    // Ne pas montrer ses propres annonces sur la page principale
    if (req.user?.id) query = query.neq('user_id', req.user.id)

    if (category_id) query = query.eq('category_id', category_id)
    if (is_urgent === 'true') query = query.eq('is_urgent', true)
    if (min_price) query = query.gte('price_max', min_price)
    if (max_price) query = query.lte('price_min', max_price)

    // Filtre par état : le frontend envoie "new_with_tags,very_good" etc.
    if (condition) {
      const conditionArray = condition.split(',').filter(Boolean)
      if (conditionArray.length > 0) {
        query = query.overlaps('conditions', conditionArray)
      }
    }

    // Tri
    if (sort === 'recent') query = query.order('created_at', { ascending: false })
    else if (sort === 'price_asc') query = query.order('price_min', { ascending: true })
    else if (sort === 'price_desc') query = query.order('price_max', { ascending: false })
    else if (sort === 'urgent') query = query.order('is_urgent', { ascending: false }).order('created_at', { ascending: false })

    const offset = (parseInt(page) - 1) * parseInt(limit)
    query = query.range(offset, offset + parseInt(limit) - 1)

    const { data, error } = await query
    if (error) throw error

    // Filtrage côté JS
    let listings = data || []

    // Filtre par marque (sur brand_name dans listing_brands)
    if (brand) {
      const brandLower = brand.toLowerCase()
      listings = listings.filter(l =>
        l.listing_brands?.some(b => b.brand_name?.toLowerCase().includes(brandLower))
      )
    }

    if (distance) {
      // Si lat/lon absents mais utilisateur connecté → utiliser son profil
      if ((!lat || !lon) && req.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('latitude, longitude')
          .eq('id', req.user.id)
          .single()
        if (profile?.latitude && profile?.longitude) {
          lat = profile.latitude
          lon = profile.longitude
        }
      }

      if (lat && lon) {
        const userLat = parseFloat(lat)
        const userLon = parseFloat(lon)
        const maxDist = parseFloat(distance)
        listings = listings.filter(l => {
          if (!l.latitude || !l.longitude) return true
          const d = distanceKm(userLat, userLon, l.latitude, l.longitude)
          return d <= Math.min(maxDist, l.max_distance_km)
        })
      }
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
        listing_brands (brand_name)
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
      .select(`*, listing_images (url, sort_order), categories:category_id (name), listing_brands (brand_name)`)
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
      .select(`*, listing_images (url, sort_order), categories:category_id (name), listing_brands (brand_name)`)
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

    if (parseFloat(price_min) > parseFloat(price_max)) {
      return res.status(400).json({ error: 'Le prix minimum doit être inférieur au prix maximum' })
    }

    // Récupérer la localisation du profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('city, postal_code, region, latitude, longitude')
      .eq('id', req.user.id)
      .single()

    // Construire l'objet à insérer (category_id null si absent)
    const parsedMin = parseFloat(price_min)
    const parsedMax = parseFloat(price_max)

    const insertData = {
      user_id:         req.user.id,
      category_id:     category_id || null,
      title,
      description:     description || null,
      price_min:       isNaN(parsedMin) ? 0 : parsedMin,
      price_max:       isNaN(parsedMax) ? 0 : parsedMax,
      max_distance_km: parseInt(max_distance_km) || 50,
      conditions:      Array.isArray(conditions) ? conditions : [],
      is_urgent:       is_urgent === true,
      city:            profile?.city    || null,
      postal_code:     profile?.postal_code || null,
      region:          profile?.region  || null,
      latitude:        profile?.latitude  || null,
      longitude:       profile?.longitude || null
    }

    const { data: listing, error } = await supabase
      .from('listings')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[createListing] Supabase error:', JSON.stringify(error))
      return res.status(500).json({
        error: 'Erreur lors de la création de l\'annonce',
        details: error.message,
        code: error.code
      })
    }

    // Ajouter les marques
    if (brands && brands.length > 0) {
      // Dédupliquer par nom pour éviter la contrainte unique
      const seen = new Set()
      const brandInserts = brands
        .filter(b => {
          const key = (b.name || '').toLowerCase().trim()
          if (!key || seen.has(key)) return false
          seen.add(key)
          return true
        })
        .map(b => ({
          listing_id: listing.id,
          brand_name: b.name || null
        }))

      const { error: brandError } = await supabase.from('listing_brands').insert(brandInserts)
      if (brandError) {
        console.warn('[createListing] brand insert warning:', brandError.message)
        // Non bloquant : l'annonce est créée
      }
    }

    res.status(201).json(listing)
  } catch (err) {
    console.error('[createListing] exception:', err)
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
    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    const allowedFields = ['title', 'description', 'category_id', 'price_min', 'price_max', 'max_distance_km', 'conditions', 'is_urgent']
    const filtered = Object.fromEntries(Object.entries(updates).filter(([k]) => allowedFields.includes(k)))
    if ('price_min' in filtered) filtered.price_min = isNaN(parseFloat(filtered.price_min)) ? 0 : parseFloat(filtered.price_min)
    if ('price_max' in filtered) filtered.price_max = isNaN(parseFloat(filtered.price_max)) ? 0 : parseFloat(filtered.price_max)
    if ('is_urgent' in filtered) filtered.is_urgent = filtered.is_urgent === true

    const { data, error } = await supabase
      .from('listings')
      .update(filtered)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Mettre à jour les marques si fournies
    if (Array.isArray(updates.brands)) {
      // Supprimer les anciennes marques
      await supabase.from('listing_brands').delete().eq('listing_id', id)

      // Insérer les nouvelles marques (dédupliquées)
      if (updates.brands.length > 0) {
        const seen = new Set()
        const brandInserts = updates.brands
          .filter(b => {
            const key = (b.name || '').toLowerCase().trim()
            if (!key || seen.has(key)) return false
            seen.add(key)
            return true
          })
          .map(b => ({
            listing_id: id,
            brand_name: b.name
          }))

        if (brandInserts.length > 0) {
          const { error: brandError } = await supabase.from('listing_brands').insert(brandInserts)
          if (brandError) console.warn('[updateListing] brand insert warning:', brandError.message)
        }
      }
    }

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
    if (existing.user_id !== req.user.id) {
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
    if (existing.user_id !== req.user.id) {
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

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Aucune image fournie' })
    }

    // Vérifier propriétaire
    const { data: listing } = await supabase
      .from('listings')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!listing || listing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé' })
    }

    // Récupérer le sort_order actuel max
    const { data: existingImgs } = await supabase
      .from('listing_images')
      .select('sort_order')
      .eq('listing_id', id)
      .order('sort_order', { ascending: false })
      .limit(1)
    const startOrder = (existingImgs?.[0]?.sort_order ?? -1) + 1

    const uploaded = []
    const errors = []

    for (let i = 0; i < images.length; i++) {
      const { base64, filename } = images[i]
      const buffer = Buffer.from(base64, 'base64')

      // Détecter le type MIME depuis le header base64 ou le nom de fichier
      const ext = (filename || '').split('.').pop().toLowerCase()
      const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }
      const contentType = mimeMap[ext] || 'image/jpeg'

      const storagePath = `listings/${id}/${uuidv4()}-${filename}`

      const { error: uploadError } = await supabase.storage
        .from('wantit-images')
        .upload(storagePath, buffer, { contentType, upsert: false })

      if (uploadError) {
        console.error(`[uploadImages] Storage error for ${filename}:`, uploadError.message)
        errors.push({ filename, error: uploadError.message })
        continue
      }

      const { data: { publicUrl } } = supabase.storage
        .from('wantit-images')
        .getPublicUrl(storagePath)

      const { data: img, error: dbError } = await supabase
        .from('listing_images')
        .insert({ listing_id: id, url: publicUrl, sort_order: startOrder + i })
        .select()
        .single()

      if (dbError) {
        console.error(`[uploadImages] DB insert error:`, dbError.message)
        errors.push({ filename, error: dbError.message })
        continue
      }

      uploaded.push(img)
    }

    if (uploaded.length === 0 && errors.length > 0) {
      console.error('[uploadImages] All uploads failed:', errors)
      return res.status(500).json({
        error: 'Échec de l\'upload. Vérifiez que le bucket "wantit-images" existe dans Supabase Storage.',
        details: process.env.NODE_ENV !== 'production' ? errors : undefined
      })
    }

    res.json({ images: uploaded, errors: errors.length > 0 ? errors : undefined })
  } catch (err) {
    console.error('[uploadImages] exception:', err)
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
