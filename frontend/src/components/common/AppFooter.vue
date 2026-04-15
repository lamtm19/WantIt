<template>
  <footer class="bg-white border-t border-gray-100 mt-12">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <p class="font-black text-xl text-primary-600">WantIt</p>
          <p class="text-sm text-gray-500 mt-1">Trouvez ce que vous cherchez, vendez ce que vous avez.</p>
        </div>
        <div class="flex items-center gap-6 text-sm text-gray-500">
          <RouterLink to="/legal" class="hover:text-gray-900 transition">Mentions légales</RouterLink>
          <a href="mailto:support@wantit.app" class="hover:text-gray-900 transition">Contact</a>
        </div>
      </div>
      <!-- Mention légale -->
      <div class="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
        <p class="text-xs text-amber-800 text-center leading-relaxed">
          ⚠️ Cette plateforme met <strong>uniquement en relation</strong> des utilisateurs.
          Les transactions se font <strong>en main propre</strong>.
          Nous ne sommes pas responsables des paiements ou échanges.
        </p>
      </div>
      <p class="text-center text-xs text-gray-400 mt-4">© {{ year }} WantIt — Tous droits réservés</p>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>
