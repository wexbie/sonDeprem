const API_URL = 'https://api.orhanaydogdu.com.tr/deprem/kandilli/live';
let mobilMenuAcik = false;
let bildirimIzniVerildi = false;
let sonDepremZamani = null;

function mobilMenuDegistir() {
    const yanMenu = document.querySelector('aside');
    const arkaFon = document.getElementById('mobilMenuArkafon');
    mobilMenuAcik = !mobilMenuAcik;
    
    if (mobilMenuAcik) {
        yanMenu.classList.remove('hidden');
        yanMenu.classList.add('fixed', 'inset-0', 'z-50', 'w-72');
        arkaFon.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    } else {
        yanMenu.classList.add('hidden');
        yanMenu.classList.remove('fixed', 'inset-0', 'z-50', 'w-72');
        arkaFon.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function karanlikModDegistir() {
    const html = document.documentElement;
    const karanlikMi = html.classList.contains('karanlik');
    
    if (karanlikMi) {
        html.classList.remove('karanlik');
        localStorage.setItem('tema', 'aydinlik');
    } else {
        html.classList.add('karanlik');
        localStorage.setItem('tema', 'karanlik');
    }
}

async function bildirimIzniIste() {
    try {
        if (!("Notification" in window)) {
            alert("Bu tarayıcı bildirim desteği sunmuyor.");
            return false;
        }
        if (Notification.permission === "granted") {
            bildirimIzniVerildi = true;
            return true;
        }
        if (Notification.permission !== "denied") {
            const izin = await Notification.requestPermission();
            bildirimIzniVerildi = izin === "granted";
            return bildirimIzniVerildi;
        }
        return false;
    } catch (hata) {
        console.error('izin hatası:', hata);
        return false;
    }
}

async function bildirimGonder(deprem) {
    if (!bildirimIzniVerildi) return;
    try {
        if ('serviceWorker' in navigator) {
            const bildirimKaydedici = await navigator.serviceWorker.ready;
            await bildirimKaydedici.showNotification('Yeni Deprem!', {
                body: `Konum: ${deprem.lokasyon}\nBüyüklük: ${deprem.mag}\n${deprem.title}`,
                icon: '/favicon.ico',
                tag: 'deprem',
                vibrate: [200, 100, 200],
                requireInteraction: true,
                actions: [
                    {
                        action: 'detay',
                        title: 'Detayları Göster'
                    }
                ]
            });
        } else {
            const bildirim = new Notification('Yeni Deprem!', {
                body: `Konum: ${deprem.lokasyon}\nBüyüklük: ${deprem.mag}\n${deprem.title}`,
                icon: '/favicon.ico',
                tag: 'deprem'
            });
            bildirim.onclick = function() {
                window.focus();
                this.close();
            };
        }
    } catch (hata) {
        console.error('bildirim hatası:', hata);
    }
}

async function depremVerileriniGuncelle() {
    try {
        const yanit = await fetch(API_URL);
        const veri = await yanit.json();
        
        if (veri.status && veri.result) {
            if (veri.result.length > 0) {
                const yeniDepremZamani = new Date(veri.result[0].date).getTime();
                
                if (sonDepremZamani && yeniDepremZamani > sonDepremZamani) {
                    bildirimGonder(veri.result[0]);
                }
                sonDepremZamani = yeniDepremZamani;
            }
            
            depremleriGoster(veri.result);
            istatistikleriGuncelle(veri.result);
        }
    } catch (hata) {
        console.error('veri hatası:', hata);
    }
}

function depremleriGoster(depremler) {
    const depremListesi = document.getElementById('depremListesi');
    depremListesi.innerHTML = '';

    depremler.forEach(deprem => {
        const buyuklukSinifi = buyuklukSinifiAl(deprem.mag);
        const tarih = new Date(deprem.date);
        const depremOge = document.createElement('div');

        depremOge.className = `deprem-oge ${buyuklukSinifi}`;
        depremOge.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-semibold text-lg">${deprem.title || 'Başlık bilgisi yok'}</h3>
                    <p class="text-soluk-yazi">${tarih.toLocaleString('tr-TR')}</p>
                </div>
                <div>
                    <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium bg-birincil text-birincil-yazi">
                        ${deprem.mag || '?'}
                    </span>
                </div>
            </div>
        `;
        depremListesi.appendChild(depremOge);
    });
}

function istatistikleriGuncelle(depremler) {
    document.getElementById('toplamDeprem').textContent = depremler.length;
    const maksimumBuyukluk = Math.max(...depremler.map(d => d.mag));
    document.getElementById('maksimumBuyukluk').textContent = maksimumBuyukluk.toFixed(1);
    
    if (depremler.length > 0) {
        const sonDeprem = depremler[0];
        const tarih = new Date(sonDeprem.date);
        document.getElementById('sonDeprem').textContent = 
            `${sonDeprem.title || 'Bilgi yok'} (${tarih.toLocaleString('tr-TR')})`;
    }
    document.getElementById('sonGuncelleme').textContent = new Date().toLocaleString('tr-TR');
}

function buyuklukSinifiAl(buyukluk) {
    if (buyukluk >= 6.0) return 'buyukluk-6plus';
    if (buyukluk >= 5.0) return 'buyukluk-5';
    if (buyukluk >= 4.0) return 'buyukluk-4';
    if (buyukluk >= 3.0) return 'buyukluk-3';
    if (buyukluk >= 2.0) return 'buyukluk-2';
    if (buyukluk >= 1.0) return 'buyukluk-1';
    return 'buyukluk-0';
}

document.addEventListener('DOMContentLoaded', async () => {
    const bildirimDugmeleri = document.querySelectorAll('[data-bildirim]');
    bildirimDugmeleri.forEach(dugme => {
        dugme.addEventListener('click', async () => {
            const izinVerildi = await bildirimIzniIste();
            if (izinVerildi) {
                alert('Bildirimler açıldı! Yeni deprem olduğunda haberdar olacaksınız.');
            } else {
                alert('Bildirim izni reddedildi veya bir hata oluştu.');
            }
        });
    });
    if ('serviceWorker' in navigator) {
        try {
            const bildirimKaydedici = await navigator.serviceWorker.register('/sw.js');
            console.log('serviceWorker kaydı başarılı:', bildirimKaydedici.scope);
        } catch (hata) {
            console.error('serviceWorker kaydı başarısız:', hata);
        }
    }
    const mobilMenuButon = document.querySelector('.mobil-menu-buton');
    if (mobilMenuButon) {
        mobilMenuButon.addEventListener('click', mobilMenuDegistir);
    }
    const arkaFon = document.getElementById('mobilMenuArkafon');
    if (arkaFon) {
        arkaFon.addEventListener('click', mobilMenuDegistir);
    }
    const temaDegistirButon = document.getElementById('temaDegistir');
    if (temaDegistirButon) {
        temaDegistirButon.addEventListener('click', karanlikModDegistir);
    }
    await depremVerileriniGuncelle();
    setInterval(depremVerileriniGuncelle, 30000);
}); 