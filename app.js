// Import theme management module
import { initTheme } from './theme.js';

let dataAngsuran = [];
let bulanDipilih = null;
let riwayatPelunasan = [];
let bungaAsli = {}; // Menyimpan bunga asli untuk setiap bulan
let totalPembayaranAwal = 0; // Total pembayaran sebelum pelunasan
let flagPelunasan = false;

document.addEventListener('DOMContentLoaded', function () {
    // Initialize theme (dark/light mode)
    initTheme();

    const jenisBungaSelect = document.getElementById('jenisBunga');
    const bungaFixSection = document.getElementById('bungaFixSection');
    const bungaBerjenjangSection = document.getElementById('bungaBerjenjangSection');
    const bungaFloatingSection = document.getElementById('bungaFloatingSection');
    const bungaFloatingBerjenjangSection = document.getElementById('bungaFloatingBerjenjangSection');
    const periodeFixInput = document.getElementById('periodeFix');
    const kprForm = document.getElementById('kprForm');
    const tambahBerjenjangBtn = document.getElementById('tambahBerjenjang');
    const modal = document.getElementById('pelunasanModal');
    const closeModal = document.querySelector('.close');
    const jenisPelunasanSelect = document.getElementById('jenisPelunasan');
    const jumlahPelunasanGroup = document.getElementById('jumlahPelunasanGroup');
    const btnProsesPelunasan = document.getElementById('btnProsesPelunasan');

    jenisBungaSelect.addEventListener('change', function () {
        bungaFixSection.style.display = 'none';
        bungaBerjenjangSection.style.display = 'none';
        bungaFloatingSection.style.display = 'none';
        bungaFloatingBerjenjangSection.style.display = 'none';

        if (this.value === 'fix') {
            bungaFixSection.style.display = 'block';

            // Cek apakah perlu tampilkan floating section
            const jangkaWaktu = parseInt(document.getElementById('jangkaWaktu').value);
            const periodeFix = parseInt(periodeFixInput.value);

            if (periodeFix && periodeFix > 0 && jangkaWaktu && periodeFix < jangkaWaktu) {
                bungaFloatingSection.style.display = 'block';
            }
        } else if (this.value === 'berjenjang') {
            bungaBerjenjangSection.style.display = 'block';
            bungaFloatingBerjenjangSection.style.display = 'block'; // Selalu tampilkan untuk berjenjang
        }
    });

    // Show/hide floating rate section based on periode fix input
    periodeFixInput.addEventListener('input', function () {
        const jangkaWaktu = parseInt(document.getElementById('jangkaWaktu').value);
        const periodeFix = parseInt(this.value);

        if (periodeFix && periodeFix > 0 && jangkaWaktu && periodeFix < jangkaWaktu) {
            bungaFloatingSection.style.display = 'block';
        } else {
            bungaFloatingSection.style.display = 'none';
            document.getElementById('bungaFloating').value = '';
        }
    });

    tambahBerjenjangBtn.addEventListener('click', function () {
        const container = document.getElementById('berjenjangContainer');
        const newItem = document.createElement('div');
        newItem.className = 'berjenjang-item';
        newItem.innerHTML = `
            <div class="form-group">
                <label>Tahun Ke-</label>
                <input type="number" class="tahun-ke" min="1" placeholder="1-3" required>
            </div>
            <div class="form-group">
                <label>Sampai Tahun Ke-</label>
                <input type="number" class="sampai-tahun" min="1" placeholder="3" required>
            </div>
            <div class="form-group">
                <label>Bunga (% per tahun)</label>
                <input type="number" class="bunga-persen" step="0.01" placeholder="6.5" required>
            </div>
            <button type="button" class="btn-danger hapus-berjenjang">Hapus</button>
        `;
        container.appendChild(newItem);

        newItem.querySelector('.hapus-berjenjang').addEventListener('click', function () {
            newItem.remove();
        });
    });

    // Disable HTML5 validation to prevent errors with hidden fields
    kprForm.setAttribute('novalidate', 'novalidate');

    kprForm.addEventListener('submit', function (e) {
        e.preventDefault();
        hitungKPR();
    });

    closeModal.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    jenisPelunasanSelect.addEventListener('change', function () {
        if (this.value === 'penuh') {
            jumlahPelunasanGroup.style.display = 'none';
        } else {
            jumlahPelunasanGroup.style.display = 'block';
        }
    });

    btnProsesPelunasan.addEventListener('click', prosesPelunasan);

    // Format input fields with thousand separators
    const inputFields = ['hargaProperti', 'uangMuka', 'jumlahPelunasan'];
    inputFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function (e) {
                let value = e.target.value.replace(/\./g, '');
                if (value && !isNaN(value)) {
                    e.target.value = formatAngkaInput(parseInt(value));
                }
            });
        }
    });
});

function hitungKPR() {
    const hargaProperti = parseAngkaInput(document.getElementById('hargaProperti').value);
    const uangMuka = parseAngkaInput(document.getElementById('uangMuka').value);
    const jangkaWaktu = parseInt(document.getElementById('jangkaWaktu').value);
    const jenisBunga = document.getElementById('jenisBunga').value;

    if (!hargaProperti || !uangMuka || !jangkaWaktu || !jenisBunga) {
        alert('Mohon lengkapi semua data!');
        return;
    }

    const pinjaman = hargaProperti - uangMuka;
    const totalBulan = jangkaWaktu * 12;

    dataAngsuran = [];
    riwayatPelunasan = [];
    totalPembayaranAwal = 0; // Reset total pembayaran awal

    if (jenisBunga === 'fix') {
        const bungaTahunan = parseFloat(document.getElementById('bungaFix').value);
        if (!bungaTahunan) {
            alert('Mohon masukkan bunga fix!');
            return;
        }

        const periodeFix = parseInt(document.getElementById('periodeFix').value);
        const bungaFloating = parseFloat(document.getElementById('bungaFloating').value);

        // Check if partial fix period is specified
        if (periodeFix && periodeFix > 0 && periodeFix < jangkaWaktu) {
            if (!bungaFloating) {
                alert('Mohon masukkan bunga floating untuk periode setelah bunga fix!');
                return;
            }
            hitungBungaFixDanFloating(pinjaman, bungaTahunan, bungaFloating, periodeFix, totalBulan);
        } else {
            hitungBungaFix(pinjaman, bungaTahunan, totalBulan);
        }
    } else if (jenisBunga === 'berjenjang') {
        const berjenjangItems = document.querySelectorAll('.berjenjang-item');
        const jenjangData = [];

        berjenjangItems.forEach(item => {
            const tahunKe = parseInt(item.querySelector('.tahun-ke').value);
            const sampaiTahun = parseInt(item.querySelector('.sampai-tahun').value);
            const bunga = parseFloat(item.querySelector('.bunga-persen').value);

            if (tahunKe && sampaiTahun && bunga) {
                jenjangData.push({ tahunKe, sampaiTahun, bunga });
            }
        });

        if (jenjangData.length === 0) {
            alert('Mohon masukkan minimal 1 jenjang bunga!');
            return;
        }

        jenjangData.sort((a, b) => a.tahunKe - b.tahunKe);

        const bungaFloatingBerjenjang = parseFloat(document.getElementById('bungaFloatingBerjenjang').value);
        hitungBungaBerjenjang(pinjaman, jenjangData, totalBulan, jangkaWaktu, bungaFloatingBerjenjang);
    }

    // Simpan total pembayaran awal (sebelum ada pelunasan)
    totalPembayaranAwal = dataAngsuran.reduce((sum, item) => sum + item.angsuran, 0);

    tampilkanHasil();
}

function hitungBungaFix(pinjaman, bungaTahunan, totalBulan) {
    const bungaBulanan = bungaTahunan / 100 / 12;
    const angsuranPerBulan = pinjaman * bungaBulanan * Math.pow(1 + bungaBulanan, totalBulan) /
        (Math.pow(1 + bungaBulanan, totalBulan) - 1);

    let sisaPinjaman = pinjaman;

    for (let i = 1; i <= totalBulan; i++) {
        const bungaBulanIni = sisaPinjaman * bungaBulanan;
        const pokokBulanIni = angsuranPerBulan - bungaBulanIni;
        sisaPinjaman -= pokokBulanIni;

        dataAngsuran.push({
            bulan: i,
            angsuran: angsuranPerBulan,
            pokok: pokokBulanIni,
            bunga: bungaBulanIni,
            sisaPinjaman: Math.max(0, sisaPinjaman),
            bungaTahunan: bungaTahunan // Simpan bunga asli
        });
    }
}

function hitungBungaFixDanFloating(pinjaman, bungaFix, bungaFloating, periodeFix, totalBulan) {
    let sisaPinjaman = pinjaman;
    const bulanFix = periodeFix * 12;

    // Periode Fix
    const bungaBulananFix = bungaFix / 100 / 12;
    const angsuranPerBulanFix = pinjaman * bungaBulananFix * Math.pow(1 + bungaBulananFix, totalBulan) /
        (Math.pow(1 + bungaBulananFix, totalBulan) - 1);

    for (let i = 1; i <= bulanFix; i++) {
        const bungaBulanIni = sisaPinjaman * bungaBulananFix;
        const pokokBulanIni = angsuranPerBulanFix - bungaBulanIni;
        sisaPinjaman -= pokokBulanIni;

        dataAngsuran.push({
            bulan: i,
            angsuran: angsuranPerBulanFix,
            pokok: pokokBulanIni,
            bunga: bungaBulanIni,
            sisaPinjaman: Math.max(0, sisaPinjaman),
            bungaTahunan: bungaFix // Simpan bunga asli
        });
    }

    // Periode Floating
    const sisaBulan = totalBulan - bulanFix;
    if (sisaBulan > 0 && sisaPinjaman > 0) {
        const bungaBulananFloating = bungaFloating / 100 / 12;
        const angsuranPerBulanFloating = sisaPinjaman * bungaBulananFloating * Math.pow(1 + bungaBulananFloating, sisaBulan) /
            (Math.pow(1 + bungaBulananFloating, sisaBulan) - 1);

        for (let i = bulanFix + 1; i <= totalBulan; i++) {
            const bungaBulanIni = sisaPinjaman * bungaBulananFloating;
            const pokokBulanIni = angsuranPerBulanFloating - bungaBulanIni;
            sisaPinjaman -= pokokBulanIni;

            dataAngsuran.push({
                bulan: i,
                angsuran: angsuranPerBulanFloating,
                pokok: pokokBulanIni,
                bunga: bungaBulanIni,
                sisaPinjaman: Math.max(0, sisaPinjaman),
                bungaTahunan: bungaFloating // Simpan bunga asli
            });
        }
    }
}

function hitungBungaBerjenjang(pinjaman, jenjangData, totalBulan, jangkaWaktu, bungaFloating) {
    let sisaPinjaman = pinjaman;
    let bulanSekarang = 0;

    for (let jenjang of jenjangData) {
        const bulanMulai = (jenjang.tahunKe - 1) * 12 + 1;
        const bulanAkhir = Math.min(jenjang.sampaiTahun * 12, totalBulan);
        const jumlahBulanJenjang = bulanAkhir - bulanMulai + 1;

        if (bulanMulai > totalBulan) break;

        const bungaBulanan = jenjang.bunga / 100 / 12;
        const sisaBulan = totalBulan - bulanMulai + 1;

        const angsuranPerBulan = sisaPinjaman * bungaBulanan * Math.pow(1 + bungaBulanan, sisaBulan) /
            (Math.pow(1 + bungaBulanan, sisaBulan) - 1);

        for (let i = 0; i < jumlahBulanJenjang; i++) {
            bulanSekarang++;
            const bungaBulanIni = sisaPinjaman * bungaBulanan;
            const pokokBulanIni = angsuranPerBulan - bungaBulanIni;
            sisaPinjaman -= pokokBulanIni;

            dataAngsuran.push({
                bulan: bulanSekarang,
                angsuran: angsuranPerBulan,
                pokok: pokokBulanIni,
                bunga: bungaBulanIni,
                sisaPinjaman: Math.max(0, sisaPinjaman),
                bungaTahunan: jenjang.bunga // Simpan bunga asli
            });

            if (sisaPinjaman <= 0) break;
        }

        if (sisaPinjaman <= 0) break;
    }

    // Gunakan bunga floating jika tersedia, jika tidak gunakan jenjang terakhir
    while (bulanSekarang < totalBulan && sisaPinjaman > 0) {
        const jenjangTerakhir = jenjangData[jenjangData.length - 1];
        const bungaYangDigunakan = bungaFloating || jenjangTerakhir.bunga;
        const bungaBulanan = bungaYangDigunakan / 100 / 12;
        const sisaBulan = totalBulan - bulanSekarang;

        const angsuranPerBulan = sisaPinjaman * bungaBulanan * Math.pow(1 + bungaBulanan, sisaBulan) /
            (Math.pow(1 + bungaBulanan, sisaBulan) - 1);

        bulanSekarang++;
        const bungaBulanIni = sisaPinjaman * bungaBulanan;
        const pokokBulanIni = angsuranPerBulan - bungaBulanIni;
        sisaPinjaman -= pokokBulanIni;

        dataAngsuran.push({
            bulan: bulanSekarang,
            angsuran: angsuranPerBulan,
            pokok: pokokBulanIni,
            bunga: bungaBulanIni,
            sisaPinjaman: Math.max(0, sisaPinjaman),
            bungaTahunan: bungaYangDigunakan // Simpan bunga asli
        });
    }
}

function tampilkanStrukturBunga() {
    const strukturHTML = [];
    const periodeBunga = [];

    // Analisis struktur bunga dari dataAngsuran
    if (dataAngsuran.length > 0) {
        let bungaSaatIni = dataAngsuran[0].bungaTahunan;
        let bulanMulai = 1;

        for (let i = 1; i < dataAngsuran.length; i++) {
            if (dataAngsuran[i].bungaTahunan !== bungaSaatIni) {
                periodeBunga.push({
                    bulanMulai: bulanMulai,
                    bulanAkhir: i,
                    bunga: bungaSaatIni
                });
                bungaSaatIni = dataAngsuran[i].bungaTahunan;
                bulanMulai = i + 1;
            }
        }

        // Tambahkan periode terakhir
        periodeBunga.push({
            bulanMulai: bulanMulai,
            bulanAkhir: dataAngsuran.length,
            bunga: bungaSaatIni
        });
    }

    // Generate HTML untuk setiap periode
    if (periodeBunga.length === 1) {
        strukturHTML.push(`
            <div style="padding: 8px; background: white; border-radius: 5px; margin-bottom: 5px;">
                <strong>Bunga Tetap:</strong> ${periodeBunga[0].bunga}% per tahun untuk seluruh periode (${dataAngsuran.length} bulan)
            </div>
        `);
    } else {
        periodeBunga.forEach((periode, idx) => {
            const durasi = periode.bulanAkhir - periode.bulanMulai + 1;
            const tahun = Math.floor(durasi / 12);
            const bulan = durasi % 12;
            const durasiText = `${tahun > 0 ? tahun + ' tahun' : ''}${bulan > 0 ? ' ' + bulan + ' bulan' : ''}`.trim();

            strukturHTML.push(`
                <div style="padding: 8px; background: white; border-radius: 5px; margin-bottom: 5px;">
                    <strong>Periode ${idx + 1}:</strong> ${periode.bunga}% per tahun
                    <br><small style="color: #888;">Bulan ${periode.bulanMulai} - ${periode.bulanAkhir} (${durasiText})</small>
                </div>
            `);
        });
    }

    document.getElementById('strukturBungaDetail').innerHTML = strukturHTML.join('');
}

function tampilkanHasil() {
    const totalBunga = dataAngsuran.reduce((sum, item) => sum + item.bunga, 0);
    const totalPembayaran = dataAngsuran.reduce((sum, item) => sum + item.angsuran, 0);
    const jumlahPinjaman = dataAngsuran[0].sisaPinjaman + dataAngsuran[0].pokok;
    const cicilanBulanPertama = dataAngsuran[0].angsuran;
    const totalBulan = dataAngsuran.length;
    const totalTahun = Math.floor(totalBulan / 12);
    const sisaBulan = totalBulan % 12;

    // Ringkasan Utama
    document.getElementById('cicilanPerBulan').textContent = formatRupiah(cicilanBulanPertama);
    document.getElementById('jangkaWaktuInfo').textContent = `${totalTahun} Tahun${sisaBulan > 0 ? ` ${sisaBulan} Bulan` : ''}`;
    const bungaEfektifPersen = ((totalBunga / jumlahPinjaman) * 100).toFixed(2);
    document.getElementById('bungaEfektif').textContent = `${bungaEfektifPersen}%`;

    // Detail Pinjaman
    document.getElementById('jumlahPinjaman').textContent = formatRupiah(jumlahPinjaman);
    document.getElementById('totalBunga').textContent = formatRupiah(totalBunga);
    const rasioBungaPersen = ((totalBunga / totalPembayaranAwal) * 100).toFixed(2);
    document.getElementById('rasioBunga').textContent = `${rasioBungaPersen}% dari total pembayaran`;
    document.getElementById('totalPembayaranAwal').textContent = formatRupiah(totalPembayaranAwal);

    // Struktur Bunga Info
    tampilkanStrukturBunga();

    // Tampilkan ringkasan pelunasan jika ada
    if (riwayatPelunasan.length > 0) {
        const totalPelunasanNominal = riwayatPelunasan.reduce((sum, item) => sum + item.jumlah, 0);
        const totalPembayaranAkhir = totalPembayaran + totalPelunasanNominal;
        const pengheematanPembayaran = totalPembayaranAwal - totalPembayaranAkhir;
        const persentaseHemat = ((pengheematanPembayaran / totalPembayaranAwal) * 100).toFixed(2);

        // Tampilkan section detail pelunasan
        document.getElementById('detailPelunasanSection').style.display = 'block';
        document.getElementById('totalPelunasanSebagian').textContent = formatRupiah(totalPelunasanNominal);
        document.getElementById('totalPembayaranAkhir').textContent = formatRupiah(totalPembayaranAkhir);
        document.getElementById('pengheematanPembayaran').textContent = formatRupiah(pengheematanPembayaran);
        document.getElementById('persentasePenghematan').textContent = `${persentaseHemat}% dari total awal`;
        document.getElementById('jumlahKaliPelunasan').textContent = riwayatPelunasan.length;

        const listPelunasan = document.getElementById('listPelunasan');
        listPelunasan.innerHTML = riwayatPelunasan.map((item, idx) => {
            if (item.jenis === 'penuh') {
                return `
                    <div style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); padding: 18px; margin-bottom: 15px; border-radius: 12px; box-shadow: 0 3px 10px rgba(76, 175, 80, 0.2); border: 1px solid #81c784;">
                        <div style="display: flex; align-items: center; margin-bottom: 12px;">
                            <span style="background: #4caf50; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-weight: bold;">✓</span>
                            <h4 style="margin: 0; color: #2e7d32; font-size: 1.1em;">
                                Pelunasan Penuh #${idx + 1} - Bulan ${item.bulan}
                            </h4>
                            ${item.tag !== '-' ? `<span style="background: #1976d2; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8em; margin-left: auto;">${item.tag}</span>` : ''}
                        </div>
                        <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                            <div style="color: #555; font-size: 0.9em; margin-bottom: 4px;">
                                <strong>Tanggal:</strong> ${item.tanggal} | <strong>Jumlah:</strong> <span style="color: #2e7d32; font-weight: 700;">${formatRupiah(item.jumlah)}</span>
                            </div>
                        </div>
                        <div style="background: rgba(255, 255, 255, 0.7); padding: 10px; border-radius: 8px; font-size: 0.9em; color: #2e7d32;">
                            Sisa ${item.sisaBulan} bulan dilunasi | Penghematan: <strong style="font-size: 1.05em;">${formatRupiah(item.penghematan)}</strong>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div style="background: linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%); padding: 18px; margin-bottom: 15px; border-radius: 12px; box-shadow: 0 3px 10px rgba(255, 193, 7, 0.2); border: 1px solid #ffd54f;">
                        <div style="display: flex; align-items: center; margin-bottom: 12px;">
                            <h4 style="margin: 0; color: #f57c00; font-size: 1.1em;">
                                Pelunasan Sebagian #${idx + 1} - Bulan ${item.bulan}
                            </h4>
                            ${item.tag !== '-' ? `<span style="background: #1976d2; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8em; margin-left: auto;">${item.tag}</span>` : ''}
                        </div>
                        <div style="background: white; padding: 12px; border-radius: 8px; margin-bottom: 8px;">
                            <div style="color: #555; font-size: 0.9em; margin-bottom: 4px;">
                                <strong>Tanggal:</strong> ${item.tanggal} | <strong>Jumlah:</strong> <span style="color: #f57c00; font-weight: 700;">${formatRupiah(item.jumlah)}</span>
                            </div>
                        </div>
                        <div style="background: rgba(255, 255, 255, 0.7); padding: 10px; border-radius: 8px; font-size: 0.9em; color: #e65100;">
                            Cicilan: <strong>${formatRupiah(item.cicilanLama)}</strong> → <strong>${formatRupiah(item.cicilanBaru)}</strong> <span style="color: #2e7d32;">(Hemat ${formatRupiah(item.selisih)}/bulan)</span>
                        </div>
                    </div>
                `;
            }
        }).join('');

        document.getElementById('ringkasanPelunasan').style.display = 'block';
    } else {
        document.getElementById('detailPelunasanSection').style.display = 'none';
        document.getElementById('ringkasanPelunasan').style.display = 'none';
    }

    const tbody = document.getElementById('tabelBody');
    tbody.innerHTML = '';

    // Cari bulan terakhir yang ada pelunasan untuk disable tombol sebelumnya
    const bulanPelunasanTerakhir = riwayatPelunasan.length > 0
        ? Math.max(...riwayatPelunasan.map(p => p.bulan))
        : 0;

    dataAngsuran.forEach((item, index) => {
        const row = document.createElement('tr');

        // Logic disable button berdasarkan flagPelunasan
        let isDisabled;
        if (flagPelunasan === false) {
            // Jika flagPelunasan false: disable ALL buttons setelah pelunasan pertama
            isDisabled = riwayatPelunasan.length > 0;
        } else {
            // Jika flagPelunasan true: hanya disable button sebelum pelunasan terakhir (behavior lama)
            isDisabled = item.bulan <= bulanPelunasanTerakhir;
        }

        row.innerHTML = `
            <td>${item.bulan}</td>
            <td>${formatRupiah(item.angsuran)}</td>
            <td>${formatRupiah(item.pokok)}</td>
            <td>${formatRupiah(item.bunga)}</td>
            <td>${formatRupiah(item.sisaPinjaman)}</td>
            <td>
                <button class="btn-secondary" onclick="bukaPelunasan(${index})" ${isDisabled ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>Lunasi</button>
            </td>
        `;
        tbody.appendChild(row);

        // Tambahkan baris pelunasan jika ada di bulan ini
        const pelunasan = riwayatPelunasan.find(p => p.bulan === item.bulan);
        if (pelunasan) {
            const pelunasanRow = document.createElement('tr');
            pelunasanRow.className = 'pelunasan-row';
            const tagBadge = pelunasan.tag !== '-' ? `<span style="background: #17a2b8; color: white; padding: 3px 10px; border-radius: 4px; font-size: 0.85em; margin-left: 10px;">${pelunasan.tag}</span>` : '';

            if (pelunasan.jenis === 'penuh') {
                pelunasanRow.style.background = '#f8d7da';
                pelunasanRow.style.borderLeft = '5px solid #dc3545';
                pelunasanRow.style.borderRight = '5px solid #dc3545';
                pelunasanRow.innerHTML = `
                    <td colspan="6">
                        <div class="pelunasan-info" style="background: #d4edda;">
                            <strong>✅ PELUNASAN PENUH - Bulan ${pelunasan.bulan}</strong>${tagBadge}<br>
                            <small style="color: #666;">Tanggal: ${pelunasan.tanggal}</small><br>
                            Jumlah Pelunasan: <strong>${formatRupiah(pelunasan.jumlah)}</strong><br>
                            Sisa ${pelunasan.sisaBulan} bulan dilunasi<br>
                            Penghematan Bunga: <strong style="color: #28a745;">${formatRupiah(pelunasan.penghematan)}</strong>
                        </div>
                    </td>
                `;
            } else {
                pelunasanRow.innerHTML = `
                    <td colspan="6">
                        <div class="pelunasan-info">
                            <strong>💰 PELUNASAN SEBAGIAN - Bulan ${pelunasan.bulan}</strong>${tagBadge}<br>
                            <small style="color: #666;">Tanggal: ${pelunasan.tanggal}</small><br>
                            Jumlah Pelunasan: <strong>${formatRupiah(pelunasan.jumlah)}</strong><br>
                            Cicilan Sebelumnya: ${formatRupiah(pelunasan.cicilanLama)} → Cicilan Baru: ${formatRupiah(pelunasan.cicilanBaru)}<br>
                            Selisih: <strong>${formatRupiah(pelunasan.selisih)}</strong> (Turun) |
                            Proporsi Pokok: ${pelunasan.proporsiPokok}% | Bunga: ${pelunasan.proporsiBunga}%
                        </div>
                    </td>
                `;
            }
            tbody.appendChild(pelunasanRow);
        }
    });

    document.getElementById('hasilSection').style.display = 'block';
}

function bukaPelunasan(index) {
    bulanDipilih = index;
    const modal = document.getElementById('pelunasanModal');
    const sisaPinjaman = dataAngsuran[index].sisaPinjaman;
    const cicilanSekarang = dataAngsuran[index].angsuran;

    document.getElementById('sisaPinjamanModal').textContent = formatRupiah(sisaPinjaman);
    document.getElementById('cicilanSekarangModal').textContent = formatRupiah(cicilanSekarang);
    document.getElementById('jumlahPelunasan').value = '';
    document.getElementById('tagAkuntansi').value = '';
    document.getElementById('jenisPelunasan').value = 'sebagian';
    document.getElementById('jumlahPelunasanGroup').style.display = 'block';
    document.getElementById('infoPelunasanResult').style.display = 'none';

    // Pastikan tombol enabled saat modal dibuka
    document.getElementById('btnProsesPelunasan').disabled = false;

    modal.style.display = 'block';
}

function prosesPelunasan() {
    if (bulanDipilih === null) return;

    // Disable button untuk mencegah double-click
    const btnProses = document.getElementById('btnProsesPelunasan');
    btnProses.disabled = true;

    const jenisPelunasan = document.getElementById('jenisPelunasan').value;
    const sisaPinjamanSekarang = dataAngsuran[bulanDipilih].sisaPinjaman;
    const cicilanSebelumnya = dataAngsuran[bulanDipilih + 1] ? dataAngsuran[bulanDipilih + 1].angsuran : 0;

    if (jenisPelunasan === 'penuh') {
        // Ambil tag akuntansi
        const tagAkuntansi = document.getElementById('tagAkuntansi').value.trim();
        const tanggal = new Date().toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Hitung total sisa bulan yang dilunasi
        const sisaBulan = dataAngsuran.length - bulanDipilih - 1;
        const totalAngsuranTersisa = dataAngsuran.slice(bulanDipilih + 1).reduce((sum, item) => sum + item.angsuran, 0);
        const penghematan = totalAngsuranTersisa - sisaPinjamanSekarang;

        // Simpan riwayat pelunasan penuh dengan ID unik
        const pelunasanBaru = {
            id: Date.now() + Math.random(), // ID unik untuk mencegah duplikasi
            bulan: dataAngsuran[bulanDipilih].bulan,
            jumlah: sisaPinjamanSekarang,
            jenis: 'penuh',
            sisaBulan: sisaBulan,
            totalAngsuranTersisa: totalAngsuranTersisa,
            penghematan: penghematan,
            tag: tagAkuntansi || '-',
            tanggal: tanggal
        };

        // Cek apakah sudah ada pelunasan yang identik (mencegah double-click)
        const sudahAda = riwayatPelunasan.some(p =>
            p.bulan === pelunasanBaru.bulan &&
            p.jumlah === pelunasanBaru.jumlah &&
            p.jenis === 'penuh' &&
            p.tanggal === pelunasanBaru.tanggal
        );

        if (!sudahAda) {
            riwayatPelunasan.push(pelunasanBaru);
        }

        dataAngsuran = dataAngsuran.slice(0, bulanDipilih + 1);
        dataAngsuran[bulanDipilih].sisaPinjaman = 0;

        alert(`Pelunasan penuh berhasil!\n\nTotal yang harus dibayar: ${formatRupiah(sisaPinjamanSekarang)}\nSisa ${sisaBulan} bulan dilunasi\nPenghematan bunga: ${formatRupiah(penghematan)}`);
        document.getElementById('pelunasanModal').style.display = 'none';
        btnProses.disabled = false;
        tampilkanHasil();
    } else {
        const jumlahPelunasan = parseAngkaInput(document.getElementById('jumlahPelunasan').value);

        if (!jumlahPelunasan || jumlahPelunasan <= 0) {
            alert('Masukkan jumlah pelunasan yang valid!');
            btnProses.disabled = false;
            return;
        }

        if (jumlahPelunasan >= sisaPinjamanSekarang) {
            dataAngsuran = dataAngsuran.slice(0, bulanDipilih + 1);
            dataAngsuran[bulanDipilih].sisaPinjaman = 0;
            alert('Jumlah pelunasan melebihi sisa pinjaman. Pinjaman lunas!');
            document.getElementById('pelunasanModal').style.display = 'none';
            btnProses.disabled = false;
            tampilkanHasil();
        } else {
            const sisaPinjamanBaru = sisaPinjamanSekarang - jumlahPelunasan;
            const sisaBulan = dataAngsuran.length - bulanDipilih - 1;

            if (sisaBulan > 0) {
                // Identifikasi periode dengan bunga yang berbeda
                const periodeBunga = [];
                let bungaSaatIni = dataAngsuran[bulanDipilih + 1].bungaTahunan;
                let indexMulai = bulanDipilih + 1;

                for (let i = bulanDipilih + 1; i < dataAngsuran.length; i++) {
                    if (dataAngsuran[i].bungaTahunan !== bungaSaatIni) {
                        // Bunga berubah, simpan periode sebelumnya
                        periodeBunga.push({
                            indexMulai: indexMulai,
                            indexAkhir: i - 1,
                            bungaTahunan: bungaSaatIni
                        });
                        bungaSaatIni = dataAngsuran[i].bungaTahunan;
                        indexMulai = i;
                    }
                }
                // Tambahkan periode terakhir
                periodeBunga.push({
                    indexMulai: indexMulai,
                    indexAkhir: dataAngsuran.length - 1,
                    bungaTahunan: bungaSaatIni
                });

                // Hitung ulang untuk setiap periode DARI BELAKANG
                // Ini memastikan perhitungan yang akurat untuk multiple periode bunga
                for (let p = periodeBunga.length - 1; p >= 0; p--) {
                    const periode = periodeBunga[p];
                    const bungaBulanan = periode.bungaTahunan / 100 / 12;

                    // Hitung sisa bulan dari periode ini sampai akhir
                    const sisaBulanDariPeriodeIni = dataAngsuran.length - periode.indexMulai;

                    // Ambil sisa pinjaman di akhir periode sebelumnya (atau gunakan sisaPinjamanBaru untuk periode pertama)
                    let sisaPinjamanAwal;
                    if (p === 0) {
                        sisaPinjamanAwal = sisaPinjamanBaru;
                    } else {
                        // Ambil dari akhir periode sebelumnya
                        sisaPinjamanAwal = dataAngsuran[periode.indexMulai - 1].sisaPinjaman;
                    }

                    // Hitung angsuran untuk periode ini
                    const angsuranPeriode = sisaPinjamanAwal * bungaBulanan * Math.pow(1 + bungaBulanan, sisaBulanDariPeriodeIni) /
                        (Math.pow(1 + bungaBulanan, sisaBulanDariPeriodeIni) - 1);

                    // Terapkan ke bulan-bulan dalam periode ini
                    let sisaPinjaman = sisaPinjamanAwal;
                    for (let i = periode.indexMulai; i <= periode.indexAkhir; i++) {
                        const bungaBulanIni = sisaPinjaman * bungaBulanan;
                        const pokokBulanIni = angsuranPeriode - bungaBulanIni;
                        sisaPinjaman -= pokokBulanIni;

                        dataAngsuran[i].angsuran = angsuranPeriode;
                        dataAngsuran[i].pokok = pokokBulanIni;
                        dataAngsuran[i].bunga = bungaBulanIni;
                        dataAngsuran[i].sisaPinjaman = Math.max(0, sisaPinjaman);
                        // Tetap simpan bunga tahunan asli
                        dataAngsuran[i].bungaTahunan = periode.bungaTahunan;
                    }
                }

                // Sekarang hitung ulang dari depan untuk memastikan konsistensi
                let sisaPinjaman = sisaPinjamanBaru;
                for (let p = 0; p < periodeBunga.length; p++) {
                    const periode = periodeBunga[p];
                    const bungaBulanan = periode.bungaTahunan / 100 / 12;
                    const sisaBulanDariPeriodeIni = dataAngsuran.length - periode.indexMulai;

                    // Hitung angsuran untuk periode ini
                    const angsuranPeriode = sisaPinjaman * bungaBulanan * Math.pow(1 + bungaBulanan, sisaBulanDariPeriodeIni) /
                        (Math.pow(1 + bungaBulanan, sisaBulanDariPeriodeIni) - 1);

                    // Terapkan ke bulan-bulan dalam periode ini
                    for (let i = periode.indexMulai; i <= periode.indexAkhir; i++) {
                        const bungaBulanIni = sisaPinjaman * bungaBulanan;
                        const pokokBulanIni = angsuranPeriode - bungaBulanIni;
                        sisaPinjaman -= pokokBulanIni;

                        dataAngsuran[i].angsuran = angsuranPeriode;
                        dataAngsuran[i].pokok = pokokBulanIni;
                        dataAngsuran[i].bunga = bungaBulanIni;
                        dataAngsuran[i].sisaPinjaman = Math.max(0, sisaPinjaman);
                        dataAngsuran[i].bungaTahunan = periode.bungaTahunan;
                    }
                }

                const angsuranBaru = dataAngsuran[bulanDipilih + 1].angsuran;
                const selisih = cicilanSebelumnya - angsuranBaru;
                const proporsiPokokPersen = (dataAngsuran[bulanDipilih + 1].pokok / angsuranBaru * 100).toFixed(2);
                const proporsiBungaPersen = (dataAngsuran[bulanDipilih + 1].bunga / angsuranBaru * 100).toFixed(2);

                // Ambil tag akuntansi
                const tagAkuntansi = document.getElementById('tagAkuntansi').value.trim();
                const tanggal = new Date().toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                // Simpan riwayat pelunasan dengan ID unik
                const pelunasanBaru = {
                    id: Date.now() + Math.random(), // ID unik untuk mencegah duplikasi
                    bulan: dataAngsuran[bulanDipilih].bulan,
                    jumlah: jumlahPelunasan,
                    jenis: 'sebagian',
                    cicilanLama: cicilanSebelumnya,
                    cicilanBaru: angsuranBaru,
                    selisih: selisih,
                    proporsiPokok: proporsiPokokPersen,
                    proporsiBunga: proporsiBungaPersen,
                    tag: tagAkuntansi || '-',
                    tanggal: tanggal
                };

                // Cek apakah sudah ada pelunasan yang identik (mencegah double-click)
                const sudahAda = riwayatPelunasan.some(p =>
                    p.bulan === pelunasanBaru.bulan &&
                    p.jumlah === pelunasanBaru.jumlah &&
                    p.tanggal === pelunasanBaru.tanggal &&
                    !p.processed
                );

                if (!sudahAda) {
                    riwayatPelunasan.push(pelunasanBaru);
                }

                document.getElementById('cicilanSebelum').textContent = formatRupiah(cicilanSebelumnya);
                document.getElementById('cicilanSesudah').textContent = formatRupiah(angsuranBaru);
                document.getElementById('selisihCicilan').textContent = formatRupiah(selisih) + ' (Turun)';
                document.getElementById('proporsiPokok').textContent = formatRupiah(dataAngsuran[bulanDipilih + 1].pokok) + ` (${proporsiPokokPersen}%)`;
                document.getElementById('proporsiBunga').textContent = formatRupiah(dataAngsuran[bulanDipilih + 1].bunga) + ` (${proporsiBungaPersen}%)`;
                document.getElementById('infoPelunasanResult').style.display = 'block';

                // Tutup modal setelah 3 detik dan update tabel
                setTimeout(() => {
                    document.getElementById('pelunasanModal').style.display = 'none';
                    btnProses.disabled = false;
                    tampilkanHasil();
                }, 3000);
            }
        }
    }
}

function formatRupiah(angka) {
    return 'Rp ' + angka.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatAngkaInput(angka) {
    return angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseAngkaInput(angkaStr) {
    return parseFloat(angkaStr.replace(/\./g, '')) || 0;
}

// Expose functions to global scope for inline event handlers (required for ES modules)
window.bukaPelunasan = bukaPelunasan;
