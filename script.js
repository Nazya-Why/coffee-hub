// ==========================================================================
// COFFEE HUB — скрипти сайту
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------------------------------
     1. Мобільне меню: відкриття/закриття по кліку на гамбургер
     ------------------------------------------------------------------ */
  const burgerBtn = document.getElementById('burgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');

  burgerBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('is-open');
    burgerBtn.classList.toggle('is-active', isOpen);
    burgerBtn.setAttribute('aria-expanded', isOpen);
  });

  // Закриваємо мобільне меню, коли користувач тисне на будь-яке посилання або кнопку в ньому
  mobileMenu.querySelectorAll('a, button').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('is-open');
      burgerBtn.classList.remove('is-active');
      burgerBtn.setAttribute('aria-expanded', 'false');
    });
  });

  /* ------------------------------------------------------------------
     2. Плавна прокрутка до секцій з урахуванням висоти закріпленої навігації
     ------------------------------------------------------------------ */
  const navbarHeight = document.getElementById('navbar').offsetHeight;

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href');

      // Порожній якір "#" (заглушки соцмереж) — просто ігноруємо, без переходу
      if (targetId.length <= 1) {
        event.preventDefault();
        return;
      }

      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      event.preventDefault();

      const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY - navbarHeight + 1;
      window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    });
  });

  /* ------------------------------------------------------------------
     3. Перемикання вкладок меню (Кава / Чай / Холодні напої / Випічка)
     ------------------------------------------------------------------ */
  const tabs = document.querySelectorAll('.menu__tab');
  const panels = document.querySelectorAll('.menu__grid');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetPanel = tab.dataset.tab;

      // Знімаємо активний стан з усіх вкладок і панелей
      tabs.forEach((t) => t.classList.remove('is-active'));
      panels.forEach((p) => p.classList.remove('is-active'));

      // Активуємо обрану вкладку та відповідну панель
      tab.classList.add('is-active');
      const activePanel = document.querySelector(`.menu__grid[data-panel="${targetPanel}"]`);
      activePanel.classList.add('is-active');

      // Картки показуємо одразу — це відкриття вкладки користувачем,
      // а не прокрутка, тож чекати на Intersection Observer тут не потрібно
      activePanel.querySelectorAll('.fade-in-up').forEach((el) => el.classList.add('is-visible'));
    });
  });

  /* ------------------------------------------------------------------
     4. Плавна поява елементів при прокрутці (Intersection Observer)
     ------------------------------------------------------------------ */
  const animatedElements = document.querySelectorAll('.fade-in-up');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // анімуємо лише один раз
      }
    });
  }, {
    threshold: 0.15, // елемент з'являється, коли видно 15% його висоти
  });

  animatedElements.forEach((el) => observer.observe(el));

  /* ------------------------------------------------------------------
     5. Зміна фону навігації при прокрутці (додає легку тінь)
     ------------------------------------------------------------------ */
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    navbar.style.boxShadow = window.scrollY > 10
      ? '0 4px 20px rgba(20, 15, 10, 0.15)'
      : 'none';
  });

  /* ------------------------------------------------------------------
     6. Кошик і оформлення замовлення
     ------------------------------------------------------------------ */

  // Кошик — масив товарів виду { name, price, qty }. Зберігається лише в пам'яті сторінки
  let cart = [];

  const orderOverlay = document.getElementById('orderOverlay');
  const orderForm = document.getElementById('orderForm');
  const modalSuccess = document.getElementById('modalSuccess');
  const modalSuccessText = document.getElementById('modalSuccessText');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalSuccessClose = document.getElementById('modalSuccessClose');
  const cartList = document.getElementById('cartList');
  const cartEmpty = document.getElementById('cartEmpty');
  const cartTotal = document.getElementById('cartTotal');
  const cartTotalSum = document.getElementById('cartTotalSum');
  const orderSubmitBtn = document.getElementById('orderSubmitBtn');
  const cartEmptyLink = document.getElementById('cartEmptyLink');
  const cartBadges = document.querySelectorAll('[data-cart-badge]');

  // Додає товар у кошик. Якщо він там уже є — просто збільшує кількість
  function addToCart(name, price) {
    const existing = cart.find((item) => item.name === name);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name, price, qty: 1 });
    }
    updateCartBadge();
  }

  // Змінює кількість товару на delta (+1 / -1). Прибирає товар, якщо кількість опустилась до 0
  function changeQty(name, delta) {
    const item = cart.find((i) => i.name === name);
    if (!item) return;

    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter((i) => i.name !== name);
    }

    updateCartBadge();
    renderCart();
  }

  function removeFromCart(name) {
    cart = cart.filter((i) => i.name !== name);
    updateCartBadge();
    renderCart();
  }

  function getCartTotal() {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }

  function getCartCount() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }

  // Оновлює цифру-лічильник на кнопках "Замовити" в шапці та мобільному меню
  function updateCartBadge() {
    const count = getCartCount();
    cartBadges.forEach((badge) => {
      badge.textContent = count;
      badge.hidden = count === 0;

      // Коротка пульсація бейджа, щоб було видно, що щось додалось
      badge.classList.add('is-bumped');
      setTimeout(() => badge.classList.remove('is-bumped'), 250);
    });
  }

  // Перемальовує список товарів у модальному вікні на основі поточного стану кошика
  function renderCart() {
    cartList.innerHTML = '';

    const isEmpty = cart.length === 0;
    cartEmpty.hidden = !isEmpty;
    cartTotal.hidden = isEmpty;
    orderSubmitBtn.disabled = isEmpty; // не даємо оформити порожнє замовлення

    // Текст кнопки сам пояснює її стан — і одразу показує суму до сплати
    orderSubmitBtn.textContent = isEmpty
      ? 'Кошик порожній'
      : `Підтвердити замовлення · ${getCartTotal()} ₴`;

    cart.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="cart-item__info">
          <span class="cart-item__name">${item.name}</span>
          <span class="cart-item__price">${item.price * item.qty} ₴</span>
        </div>
        <div class="cart-item__qty">
          <button type="button" class="cart-item__qty-btn" aria-label="Зменшити кількість">−</button>
          <span class="cart-item__qty-value">${item.qty}</span>
          <button type="button" class="cart-item__qty-btn" aria-label="Збільшити кількість">+</button>
        </div>
        <button type="button" class="cart-item__remove" aria-label="Прибрати ${item.name} з кошика">
          <svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
      `;

      const [decreaseBtn, increaseBtn] = row.querySelectorAll('.cart-item__qty-btn');
      decreaseBtn.addEventListener('click', () => changeQty(item.name, -1));
      increaseBtn.addEventListener('click', () => changeQty(item.name, 1));
      row.querySelector('.cart-item__remove').addEventListener('click', () => removeFromCart(item.name));

      cartList.appendChild(row);
    });

    cartTotalSum.textContent = `${getCartTotal()} ₴`;
  }

  // Елемент, на якому був фокус до відкриття вікна — щоб повернути його після закриття
  let lastFocusedElement = null;

  // Яке модальне вікно зараз відкрите (кошик чи картка товару) — потрібно для Esc і Tab
  let activeOverlay = null;

  // Загальне відкриття будь-якого модального вікна сайту
  function openModal(overlay, focusTarget) {
    lastFocusedElement = document.activeElement;
    activeOverlay = overlay;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden'; // блокуємо прокрутку фону, поки вікно відкрите

    // Переносимо фокус усередину вікна для зручної роботи з клавіатури
    focusTarget.focus();
  }

  // Загальне закриття — повертає фокус туди, звідки вікно відкрили
  function closeModal(overlay) {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    activeOverlay = null;

    if (lastFocusedElement) lastFocusedElement.focus();
  }

  // Відкриває модальне вікно кошика (без скидання самого кошика)
  function openCartModal() {
    renderCart();
    modalSuccess.hidden = true;
    orderForm.hidden = false;
    openModal(orderOverlay, modalCloseBtn);
  }

  function closeOrderModal() {
    closeModal(orderOverlay);
  }

  // Не дає фокусу вийти за межі відкритого вікна при навігації клавішею Tab
  function trapFocus(event) {
    if (event.key !== 'Tab' || !activeOverlay) return;

    // offsetParent === null означає, що елемент (або його батько) прихований —
    // наприклад, кнопка в блоці "Дякуємо", поки він ще не показаний
    const focusable = Array.from(
      activeOverlay.querySelectorAll('button:not([disabled]), input, textarea, [href]')
    ).filter((el) => el.offsetParent !== null);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  // Кнопки "+" на картках меню: тихо додають товар у кошик, не відкриваючи вікно —
  // так зручніше набирати декілька позицій підряд, гортаючи меню
  document.querySelectorAll('[data-add-to-cart]').forEach((btn) => {
    btn.addEventListener('click', () => {
      addToCart(btn.dataset.addToCart, Number(btn.dataset.price));

      // Коротка анімація прямо на кнопці як підтвердження додавання
      btn.classList.add('is-added');
      setTimeout(() => btn.classList.remove('is-added'), 400);
    });
  });

  // Кнопка "Спробувати зараз" одразу додає сезонний напій і відкриває кошик для оформлення
  document.querySelectorAll('[data-add-and-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      addToCart(btn.dataset.addAndOpen, Number(btn.dataset.price));
      openCartModal();
    });
  });

  // Кнопки "Замовити" в шапці та мобільному меню — відкривають кошик для перегляду й оформлення
  document.querySelectorAll('.cart-trigger').forEach((btn) => {
    btn.addEventListener('click', () => openCartModal());
  });

  modalCloseBtn.addEventListener('click', closeOrderModal);
  modalSuccessClose.addEventListener('click', closeOrderModal);

  // "Переглянути меню" в порожньому кошику — закриває вікно й веде до меню
  // (з тим самим відступом під закріплену навігацію, що й у звичайних посилань)
  cartEmptyLink.addEventListener('click', () => {
    closeOrderModal();
    const menuSection = document.getElementById('menu');
    const targetPosition = menuSection.getBoundingClientRect().top + window.scrollY - navbarHeight + 1;
    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
  });

  // Закриття по кліку на затемнений фон (поза самим вікном)
  orderOverlay.addEventListener('click', (event) => {
    if (event.target === orderOverlay) closeOrderModal();
  });

  // Закриття по клавіші Esc + утримання фокуса всередині вікна по Tab
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && activeOverlay) {
      closeModal(activeOverlay);
      return;
    }
    trapFocus(event);
  });

  // Відправка форми: перевіряємо, що кошик не порожній, і показуємо екран підтвердження
  orderForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (cart.length === 0) return; // кнопка й так вимкнена, це додатковий захист

    const itemsText = cart.map((item) => `${item.name} ×${item.qty}`).join(', ');
    modalSuccessText.textContent =
      `Замовлення (${itemsText}) на суму ${getCartTotal()} ₴ прийнято. Ми зв'яжемося з тобою найближчим часом.`;

    orderForm.hidden = true;
    modalSuccess.hidden = false;

    // Після успішного оформлення кошик очищається
    cart = [];
    updateCartBadge();
  });

  /* ------------------------------------------------------------------
     7. Картка товару — детальний перегляд (вага, калорійність, склад)
     ------------------------------------------------------------------ */

  // Дані про поживну цінність кожної позиції меню.
  // Ключ — точна назва товару, як вона написана в картці (.card__title)
  const productInfo = {
    'Еспресо': { weight: '30 мл', kcal: 5, protein: 0.2, fat: 0.1, carbs: 0.5,
      composition: 'Мелена кава арабіка, вода.', allergens: 'Алергенів не містить.' },
    'Капучино': { weight: '200 мл', kcal: 120, protein: 6, fat: 6, carbs: 9,
      composition: 'Кава еспресо, молоко незбиране.', allergens: 'Містить молоко.' },
    'Латте': { weight: '250 мл', kcal: 150, protein: 7, fat: 7, carbs: 11,
      composition: 'Кава еспресо, молоко незбиране.', allergens: 'Містить молоко.' },
    'Американо': { weight: '200 мл', kcal: 10, protein: 0.3, fat: 0.1, carbs: 1,
      composition: 'Кава еспресо, вода.', allergens: 'Алергенів не містить.' },
    'Чорний чай': { weight: '250 мл', kcal: 2, protein: 0, fat: 0, carbs: 0.5,
      composition: 'Чорний байховий чай, вода.', allergens: 'Алергенів не містить.' },
    'Зелений чай': { weight: '250 мл', kcal: 1, protein: 0, fat: 0, carbs: 0.3,
      composition: 'Зелений чай, м\'ята, вода.', allergens: 'Алергенів не містить.' },
    'Ягідний чай': { weight: '300 мл', kcal: 40, protein: 0.3, fat: 0, carbs: 9,
      composition: 'Каркаде, суміш ягід і фруктів, вода.', allergens: 'Алергенів не містить.' },
    'Айс-латте': { weight: '350 мл', kcal: 160, protein: 7, fat: 7, carbs: 15,
      composition: 'Кава еспресо, молоко, лід.', allergens: 'Містить молоко.' },
    'Фраппе': { weight: '350 мл', kcal: 210, protein: 5, fat: 9, carbs: 27,
      composition: 'Кава, молоко, збиті вершки, лід.', allergens: 'Містить молоко.' },
    'Холодний чай': { weight: '300 мл', kcal: 35, protein: 0, fat: 0, carbs: 8,
      composition: 'Чорний чай, лимон, лід, вода.', allergens: 'Алергенів не містить.' },
    'Круасан': { weight: '70 г', kcal: 280, protein: 6, fat: 16, carbs: 28,
      composition: 'Борошно пшеничне, вершкове масло, яйце, цукор, дріжджі.', allergens: 'Містить глютен, яйце, молоко.' },
    'Чізкейк': { weight: '120 г', kcal: 320, protein: 6, fat: 20, carbs: 28,
      composition: 'Вершковий сир, печиво, яйце, цукор, ягідний соус.', allergens: 'Містить глютен, яйце, молоко.' },
    'Брауні': { weight: '90 г', kcal: 350, protein: 5, fat: 18, carbs: 40,
      composition: 'Шоколад, вершкове масло, борошно пшеничне, яйце, цукор.', allergens: 'Містить глютен, яйце, молоко.' },
  };

  const productOverlay = document.getElementById('productOverlay');
  const productCloseBtn = document.getElementById('productCloseBtn');
  const productImage = document.getElementById('productImage');
  const productBadge = document.getElementById('productBadge');
  const productTitle = document.getElementById('productModalTitle');
  const productMeta = document.getElementById('productMeta');
  const productDescription = document.getElementById('productDescription');
  const productPrice = document.getElementById('productPrice');
  const productAddBtn = document.getElementById('productAddBtn');
  const productNutrition = document.getElementById('productNutrition');
  const productComposition = document.getElementById('productComposition');

  // Назви вкладок меню українською — для бейджа категорії на сторінці товару
  const categoryLabels = {
    coffee: 'Кава',
    tea: 'Чай',
    cold: 'Холодні напої',
    bakery: 'Випічка',
  };

  let currentProductName = null;
  let currentProductPrice = 0;

  // Заповнює й відкриває вікно товару даними з картки, на яку клікнули
  function openProductModal(card) {
    const name = card.querySelector('.card__title').textContent;
    const description = card.querySelector('.card__text').textContent;
    const price = card.querySelector('.card__order-btn').dataset.price;
    const img = card.querySelector('.photo img');
    const info = productInfo[name];
    const panelKey = card.closest('.menu__grid').dataset.panel;

    currentProductName = name;
    currentProductPrice = Number(price);

    productImage.src = img.src;
    productImage.alt = img.alt;
    productBadge.textContent = categoryLabels[panelKey] || '';
    productTitle.textContent = name;
    productMeta.textContent = `${info.weight} · ${info.kcal} ккал`;
    productDescription.textContent = description;
    productPrice.textContent = `${price} ₴`;

    productNutrition.querySelector('.product-accordion__inner').innerHTML = `
      <p><strong>Калорійність:</strong> ${info.kcal} ккал</p>
      <p><strong>Білки:</strong> ${info.protein} г · <strong>Жири:</strong> ${info.fat} г · <strong>Вуглеводи:</strong> ${info.carbs} г</p>
    `;
    productComposition.querySelector('.product-accordion__inner').innerHTML = `
      <p>${info.composition}</p>
      <p><strong>Алергени:</strong> ${info.allergens}</p>
    `;

    // Кожне відкриття починається зі згорнутих секцій
    document.querySelectorAll('.product-accordion__header').forEach((header) => {
      header.classList.remove('is-open');
    });
    document.querySelectorAll('.product-accordion__panel').forEach((panel) => {
      panel.classList.remove('is-open');
    });

    openModal(productOverlay, productCloseBtn);
  }

  function closeProductModal() {
    closeModal(productOverlay);
  }

  // Клік по картці меню відкриває детальний перегляд, окрім кліку по кнопці "+"
  document.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('.card__order-btn')) return;
      openProductModal(card);
    });

    // Доступ з клавіатури: Enter або Пробіл теж відкривають картку товару
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProductModal(card);
      }
    });
  });

  productCloseBtn.addEventListener('click', closeProductModal);
  productOverlay.addEventListener('click', (event) => {
    if (event.target === productOverlay) closeProductModal();
  });

  // "Додати в кошик" у картці товару — додає позицію і одразу показує кошик
  productAddBtn.addEventListener('click', () => {
    addToCart(currentProductName, currentProductPrice);
    closeProductModal();
    openCartModal();
  });

  // Розгортання/згортання секцій "Поживна цінність" та "Склад і алергени"
  document.querySelectorAll('.product-accordion__header').forEach((header) => {
    header.addEventListener('click', () => {
      const panel = header.nextElementSibling;
      header.classList.toggle('is-open');
      panel.classList.toggle('is-open');
    });
  });
});
