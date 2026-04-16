<template>
  <footer class="w-full pt-4">
    <div class="w-full panel-soft rounded-none px-5 py-4 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-xl">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-400">WantIt</p>
          <p class="mt-3 text-sm text-neutral-500">
            Une interface sobre pour publier un besoin, recevoir des réponses locales et garder
            l’expérience simple.
          </p>
        </div>

        <div class="flex items-center gap-6 text-sm text-gray-500">
          <RouterLink to="/legal" class="hover:text-gray-900 transition">Mentions légales</RouterLink>
          <a href="mailto:support@wantit.app" class="hover:text-gray-900 transition">Contact</a>
        </div>
      </div>

      <div class="mt-5 rounded-[1.35rem] bg-neutral-900 px-5 py-2.5 text-center text-sm text-white/80">
        Cette plateforme met uniquement en relation des utilisateurs. Les transactions se font en main propre.
      </div>

      <p class="mt-3 text-center text-xs uppercase tracking-[0.22em] text-neutral-400">
        © {{ year }} WantIt
      </p>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>
