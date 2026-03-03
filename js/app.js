// ─── Constants ─────────────────────────────────────────────
const LISTING_KEY = 'sv_listing';
const VIEWS_KEY   = 'sv_views';
const LIKES_KEY   = 'sv_likes';
const LIKED_KEY   = 'sv_liked';
const BASE_VIEWS  = 47;
const BASE_LIKES  = 12;

// Default listing data (fallback si no se publicó desde el formulario)
const DEFAULT_LISTING = {
  titulo:      'Vestido de novia talla S/M – Usado solo una vez',
  precio:      '45000',
  estado:      'Como nuevo',
  descripcion: 'Vendo mi vestido de novia. Lo usé solo el día del casamiento, está en perfectas condiciones.\n\nEscote en V, falda con cola corta y detalles de encaje en el corset. Color blanco marfil.\n\nTalla S/M (ajustable con corsé). Incluye velo y aro de flores. Lo entrego con funda original.\n\nNo hago envíos. Precio negociable para una buena persona 💛',
  talla:       'S/M',
  ubicacion:   'Buenos Aires, CABA',
  vendedora:   'Mariana G.',
  tiempo:      'Hace 2 horas'
};

// ─── Init by page ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'publicar') initPublicar();
  if (page === 'vestido')  initVestido();
});

// ─── PUBLICAR PAGE ──────────────────────────────────────────
function initPublicar() {
  const form   = document.getElementById('formPublicar');
  const slots  = document.querySelectorAll('.photo-slot');
  const inputs = document.querySelectorAll('.photo-input');

  // Photo slot click → trigger hidden file input
  slots.forEach((slot, i) => {
    slot.addEventListener('click', () => inputs[i] && inputs[i].click());
  });

  // Preview selected photos
  inputs.forEach((input, i) => {
    input.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const slot = slots[i];
        slot.classList.add('has-photo');
        // Remove old overlay content
        slot.querySelector('.photo-slot-icon') && (slot.querySelector('.photo-slot-icon').style.display = 'none');
        slot.querySelector('.photo-slot-text') && (slot.querySelector('.photo-slot-text').style.display = 'none');
        // Add preview image
        let img = slot.querySelector('img');
        if (!img) { img = document.createElement('img'); slot.appendChild(img); }
        img.src = ev.target.result;
        sessionStorage.setItem('sv_photo_' + i, ev.target.result);
      };
      reader.readAsDataURL(file);
    });
  });

  // Form submit
  form.addEventListener('submit', e => {
    e.preventDefault();

    const listing = {
      titulo:      document.getElementById('titulo').value.trim(),
      precio:      document.getElementById('precio').value.trim(),
      estado:      (document.querySelector('input[name="estado"]:checked') || {}).value || 'Buen estado',
      descripcion: document.getElementById('descripcion').value.trim(),
      talla:       document.getElementById('talla').value.trim(),
      ubicacion:   document.getElementById('ubicacion').value.trim(),
      vendedora:   'Mariana G.',
      tiempo:      'Hace un momento'
    };

    localStorage.setItem(LISTING_KEY, JSON.stringify(listing));

    // Transfer photos from sessionStorage to localStorage
    for (let i = 0; i < 4; i++) {
      const photo = sessionStorage.getItem('sv_photo_' + i);
      if (photo) localStorage.setItem('sv_photo_' + i, photo);
      else localStorage.removeItem('sv_photo_' + i);
    }

    // Reset counters for fresh listing
    localStorage.setItem(VIEWS_KEY, '0');
    localStorage.setItem(LIKES_KEY, String(BASE_LIKES));
    localStorage.setItem(LIKED_KEY, 'false');

    // Show success screen
    document.getElementById('successOverlay').classList.add('show');
  });
}

// ─── VESTIDO PAGE ───────────────────────────────────────────
function initVestido() {
  // Load saved listing or use defaults
  let listing = DEFAULT_LISTING;
  try {
    const stored = localStorage.getItem(LISTING_KEY);
    if (stored) listing = JSON.parse(stored);
  } catch(e) {}

  // Populate content
  setText('listingTitle',     listing.titulo);
  setText('listingTitleBread', listing.titulo);
  setText('listingCondition', listing.estado);
  setText('listingDescription', listing.descripcion);
  setText('listingTalla',     listing.talla || 'S/M');
  setText('listingUbicacion', listing.ubicacion || 'Buenos Aires');
  setText('listingTiempo',    listing.tiempo || 'Hace 2 horas');
  setText('sellerName',       listing.vendedora || 'Mariana G.');

  const price = parseInt(listing.precio) || 45000;
  setText('listingPrice', '$' + price.toLocaleString('es-AR'));

  // Load user photos (if published from form)
  const mainPhotoEl = document.getElementById('mainPhoto');
  const thumbEls    = document.querySelectorAll('.gallery-thumb');

  for (let i = 0; i < 4; i++) {
    const photo = localStorage.getItem('sv_photo_' + i);
    if (!photo) continue;

    if (i === 0 && mainPhotoEl) {
      mainPhotoEl.src = photo;
      mainPhotoEl.style.display = 'block';
      const placeholder = document.getElementById('mainPhotoPlaceholder');
      if (placeholder) placeholder.style.display = 'none';
    }

    if (thumbEls[i]) {
      const img = thumbEls[i].querySelector('img');
      const ph  = thumbEls[i].querySelector('.gallery-thumb-placeholder');
      if (img) { img.src = photo; img.style.display = 'block'; }
      if (ph)  ph.style.display = 'none';
    }
  }

  // Visit counter
  let views = parseInt(localStorage.getItem(VIEWS_KEY) || '0') + 1;
  localStorage.setItem(VIEWS_KEY, String(views));
  setText('viewCount', BASE_VIEWS + views);

  // Like counter + button
  let likes = parseInt(localStorage.getItem(LIKES_KEY) || String(BASE_LIKES));
  let liked = localStorage.getItem(LIKED_KEY) === 'true';
  updateLikeUI(liked, likes);

  document.getElementById('likeBtn').addEventListener('click', () => {
    liked  = !liked;
    likes += liked ? 1 : -1;
    localStorage.setItem(LIKED_KEY, String(liked));
    localStorage.setItem(LIKES_KEY, String(likes));
    updateLikeUI(liked, likes);
  });

  // Gallery thumbnails
  const thumbs    = document.querySelectorAll('.gallery-thumb');
  const mainImg   = document.getElementById('mainPhoto');
  const mainPh    = document.getElementById('mainPhotoPlaceholder');

  thumbs.forEach((thumb, i) => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');

      const img = thumb.querySelector('img');
      const ph  = thumb.querySelector('.gallery-thumb-placeholder');

      if (img && img.src && !img.src.endsWith('#')) {
        if (mainImg) { mainImg.src = img.src; mainImg.style.display = 'block'; }
        if (mainPh)  mainPh.style.display = 'none';
      } else if (ph) {
        if (mainImg) mainImg.style.display = 'none';
        if (mainPh)  { mainPh.style.display = 'flex'; mainPh.textContent = ph.textContent; }
      }
    });
  });

  // Chat modal
  const chatModal = document.getElementById('chatModal');
  document.getElementById('btnContact').addEventListener('click', () => chatModal.classList.add('open'));
  document.getElementById('btnCloseModal').addEventListener('click', () => chatModal.classList.remove('open'));
  chatModal.addEventListener('click', e => { if (e.target === chatModal) chatModal.classList.remove('open'); });

  document.getElementById('btnSendMsg').addEventListener('click', () => {
    chatModal.classList.remove('open');
    showToast('¡Mensaje enviado! La vendedora te responderá pronto 💬');
  });

  // Share button
  document.getElementById('btnShare').addEventListener('click', () => {
    if (navigator.share) {
      navigator.share({ title: listing.titulo, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('¡Link copiado al portapapeles! 🔗');
      });
    }
  });
}

// ─── Helpers ────────────────────────────────────────────────
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function updateLikeUI(liked, likes) {
  const btn  = document.getElementById('likeBtn');
  const icon = btn && btn.querySelector('.heart-icon');
  const text = btn && btn.querySelector('.like-text');
  if (!btn) return;

  if (liked) {
    btn.classList.add('active');
    if (icon) icon.textContent = '❤️';
    if (text) text.textContent = 'Guardado en favoritos';
  } else {
    btn.classList.remove('active');
    if (icon) icon.textContent = '🤍';
    if (text) text.textContent = 'Guardar en favoritos';
  }
  setText('likesCount', likes);
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transition = 'opacity 0.4s';
    setTimeout(() => t.remove(), 400);
  }, 3000);
}
