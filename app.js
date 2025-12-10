let dataAngsuran = [];
let bulanDipilih = null;
let riwayatPelunasan = [];

document.addEventListener('DOMContentLoaded', function() {
    const jenisBungaSelect = document.getElementById('jenisBunga');
    const bungaFixSection = document.getElementById('bungaFixSection');
    const bungaBerjenjangSection = document.getElementById('bungaBerjenjangSection');
    const kprForm = document.getElementById('kprForm');
    const tambahBerjenjangBtn = document.getElementById('tambahBerjenjang');
    const modal = document.getElementById('pelunasanModal');
    const closeModal = document.querySelector('.close');
    const jenisPelunasanSelect = document.getElementById('jenisPelunasan');
    const jumlahPelunasanGroup = document.getElementById('jumlahPelunasanGroup');
    const btnProsesPelunasan = document.getElementById('btnProsesPelunasan');

    jenisBungaSelect.addEventListener('change', function() {
        bungaFixSection.style.display = 'none';
        bungaBerjenjangSection.style.display = 'none';

        if (this.value === 'fix') {
            bungaFixSection.style.display = 'block';
        } else if (this.value === 'berjenjang') {
            bungaBerjenjangSection.style.display = 'block';
        }
    });

    tambahBerjenjangBtn.addEventListener('click', function() {
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

        newItem.querySelector('.hapus-berjenjang').addEventListener('click', function() {
            newItem.remove();
        });
    });

    kprForm.addEventListener('submit', function(e) {
        e.preventDefault();
        hitungKPR();
    });

    closeModal.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    jenisPelunasanSelect.addEventListener('change', function() {
        if (this.value === 'penuh') {
            jumlahPelunasanGroup.style.display = 'none';
        } else {
            jumlahPelunasanGroup.style.display = 'block';
        }
    });

    btnProsesPelunasan.addEventListener('click', prosesPelunasan);
});

function hitungKPR() {
    const hargaProperti = parseFloat(document.getElementById('hargaProperti').value);
    const uangMuka = parseFloat(document.getElementById('uangMuka').value);
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

    if (jenisBunga === 'fix') {
        const bungaTahunan = parseFloat(document.getElementById('bungaFix').value);
        if (!bungaTahunan) {
            alert('Mohon masukkan bunga fix!');
            return;
        }
        hitungBungaFix(pinjaman, bungaTahunan, totalBulan);
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
        hitungBungaBerjenjang(pinjaman, jenjangData, totalBulan, jangkaWaktu);
    }

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
            sisaPinjaman: Math.max(0, sisaPinjaman)
        });
    }
}

function hitungBungaBerjenjang(pinjaman, jenjangData, totalBulan, jangkaWaktu) {
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
                sisaPinjaman: Math.max(0, sisaPinjaman)
            });

            if (sisaPinjaman <= 0) break;
        }

        if (sisaPinjaman <= 0) break;
    }

    while (bulanSekarang < totalBulan && sisaPinjaman > 0) {
        const jenjangTerakhir = jenjangData[jenjangData.length - 1];
        const bungaBulanan = jenjangTerakhir.bunga / 100 / 12;
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
            sisaPinjaman: Math.max(0, sisaPinjaman)
        });
    }
}

function tampilkanHasil() {
    const totalBunga = dataAngsuran.reduce((sum, item) => sum + item.bunga, 0);
    const totalPembayaran = dataAngsuran.reduce((sum, item) => sum + item.angsuran, 0);
    const jumlahPinjaman = dataAngsuran[0].sisaPinjaman + dataAngsuran[0].pokok;

    document.getElementById('jumlahPinjaman').textContent = formatRupiah(jumlahPinjaman);
    document.getElementById('totalBunga').textContent = formatRupiah(totalBunga);
    document.getElementById('totalPembayaran').textContent = formatRupiah(totalPembayaran);

    const tbody = document.getElementById('tabelBody');
    tbody.innerHTML = '';

    dataAngsuran.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.bulan}</td>
            <td>${formatRupiah(item.angsuran)}</td>
            <td>${formatRupiah(item.pokok)}</td>
            <td>${formatRupiah(item.bunga)}</td>
            <td>${formatRupiah(item.sisaPinjaman)}</td>
            <td>
                <button class="btn-secondary" onclick="bukaPelunasan(${index})">Lunasi</button>
            </td>
        `;
        tbody.appendChild(row);

        // Tambahkan baris pelunasan jika ada di bulan ini
        const pelunasan = riwayatPelunasan.find(p => p.bulan === item.bulan);
        if (pelunasan) {
            const pelunasanRow = document.createElement('tr');
            pelunasanRow.className = 'pelunasan-row';
            pelunasanRow.innerHTML = `
                <td colspan="6">
                    <div class="pelunasan-info">
                        <strong>💰 PELUNASAN SEBAGIAN - Bulan ${pelunasan.bulan}</strong><br>
                        Jumlah Pelunasan: <strong>${formatRupiah(pelunasan.jumlah)}</strong><br>
                        Cicilan Sebelumnya: ${formatRupiah(pelunasan.cicilanLama)} → Cicilan Baru: ${formatRupiah(pelunasan.cicilanBaru)}<br>
                        Selisih: <strong>${formatRupiah(pelunasan.selisih)}</strong> (Turun) |
                        Proporsi Pokok: ${pelunasan.proporsiPokok}% | Bunga: ${pelunasan.proporsiBunga}%
                    </div>
                </td>
            `;
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
    document.getElementById('jenisPelunasan').value = 'sebagian';
    document.getElementById('jumlahPelunasanGroup').style.display = 'block';
    document.getElementById('infoPelunasanResult').style.display = 'none';

    modal.style.display = 'block';
}

function prosesPelunasan() {
    if (bulanDipilih === null) return;

    const jenisPelunasan = document.getElementById('jenisPelunasan').value;
    const sisaPinjamanSekarang = dataAngsuran[bulanDipilih].sisaPinjaman;
    const cicilanSebelumnya = dataAngsuran[bulanDipilih + 1] ? dataAngsuran[bulanDipilih + 1].angsuran : 0;

    if (jenisPelunasan === 'penuh') {
        dataAngsuran = dataAngsuran.slice(0, bulanDipilih + 1);
        dataAngsuran[bulanDipilih].sisaPinjaman = 0;
        alert(`Pelunasan penuh berhasil! Total yang harus dibayar: ${formatRupiah(sisaPinjamanSekarang)}`);
        document.getElementById('pelunasanModal').style.display = 'none';
        tampilkanHasil();
    } else {
        const jumlahPelunasan = parseFloat(document.getElementById('jumlahPelunasan').value);

        if (!jumlahPelunasan || jumlahPelunasan <= 0) {
            alert('Masukkan jumlah pelunasan yang valid!');
            return;
        }

        if (jumlahPelunasan >= sisaPinjamanSekarang) {
            dataAngsuran = dataAngsuran.slice(0, bulanDipilih + 1);
            dataAngsuran[bulanDipilih].sisaPinjaman = 0;
            alert('Jumlah pelunasan melebihi sisa pinjaman. Pinjaman lunas!');
            document.getElementById('pelunasanModal').style.display = 'none';
            tampilkanHasil();
        } else {
            const sisaPinjamanBaru = sisaPinjamanSekarang - jumlahPelunasan;
            const sisaBulan = dataAngsuran.length - bulanDipilih - 1;

            if (sisaBulan > 0) {
                const bungaBulanan = dataAngsuran[bulanDipilih].bunga / dataAngsuran[bulanDipilih].sisaPinjaman;
                const angsuranBaru = sisaPinjamanBaru * bungaBulanan * Math.pow(1 + bungaBulanan, sisaBulan) /
                                     (Math.pow(1 + bungaBulanan, sisaBulan) - 1);

                let sisaPinjaman = sisaPinjamanBaru;
                for (let i = bulanDipilih + 1; i < dataAngsuran.length; i++) {
                    const bungaBulanIni = sisaPinjaman * bungaBulanan;
                    const pokokBulanIni = angsuranBaru - bungaBulanIni;
                    sisaPinjaman -= pokokBulanIni;

                    dataAngsuran[i].angsuran = angsuranBaru;
                    dataAngsuran[i].pokok = pokokBulanIni;
                    dataAngsuran[i].bunga = bungaBulanIni;
                    dataAngsuran[i].sisaPinjaman = Math.max(0, sisaPinjaman);
                }

                const selisih = cicilanSebelumnya - angsuranBaru;
                const proporsiPokokPersen = (dataAngsuran[bulanDipilih + 1].pokok / angsuranBaru * 100).toFixed(2);
                const proporsiBungaPersen = (dataAngsuran[bulanDipilih + 1].bunga / angsuranBaru * 100).toFixed(2);

                // Simpan riwayat pelunasan
                riwayatPelunasan.push({
                    bulan: dataAngsuran[bulanDipilih].bulan,
                    jumlah: jumlahPelunasan,
                    cicilanLama: cicilanSebelumnya,
                    cicilanBaru: angsuranBaru,
                    selisih: selisih,
                    proporsiPokok: proporsiPokokPersen,
                    proporsiBunga: proporsiBungaPersen
                });

                document.getElementById('cicilanSebelum').textContent = formatRupiah(cicilanSebelumnya);
                document.getElementById('cicilanSesudah').textContent = formatRupiah(angsuranBaru);
                document.getElementById('selisihCicilan').textContent = formatRupiah(selisih) + ' (Turun)';
                document.getElementById('proporsiPokok').textContent = formatRupiah(dataAngsuran[bulanDipilih + 1].pokok) + ` (${proporsiPokokPersen}%)`;
                document.getElementById('proporsiBunga').textContent = formatRupiah(dataAngsuran[bulanDipilih + 1].bunga) + ` (${proporsiBungaPersen}%)`;
                document.getElementById('infoPelunasanResult').style.display = 'block';

                // Tutup modal setelah 3 detik dan update tabel
                setTimeout(() => {
                    document.getElementById('pelunasanModal').style.display = 'none';
                    tampilkanHasil();
                }, 3000);
            }
        }
    }
}

function formatRupiah(angka) {
    return 'Rp ' + angka.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
