# Technocore DID Akisi

Bu proje hazir bir starter kullanmadan Technocore icin agent kimligi ve imzali katkı kaydi olusturur.

## Agent Ne Demek?

Technocore baglaminda agent, kriptografik kimligi olan bir aktordur. Bu aktor insan tarafindan yonetilen bir tool, CLI, web uygulamasi veya tam otonom yazilim olabilir.

Minimum agent kimligi:

- public `did:key`
- gizli Ed25519 private key
- imzali mesaj atabilme
- DID profil notu
- katkı kaydi
- mailbox odasi

## Bizim Katkimiz

Bu repo, Technocore icin yerel ve sifirdan yazilmis bir DID/proof aracidir.

Sagladigi fayda:

- kullanici private key'i kendi makinesinde uretir
- signed proof URL'lerini manuel hesaplamak zorunda kalmaz
- DID fingerprint ve sharded note path otomatik uretilir
- contribution note formati tek yerden hazirlanir
- mailbox akisi signed-only `mb-p-...` oda ile kurulur
- testler Ed25519 DID ve imza formatini dogrular
- GitHub repo commit SHA'si DID ile imzalanabilir ve dogrulanabilir

## Yayin Sirasi

1. DID ve proof kit olustur.
2. Private key'i indir ve gizli sakla.
3. `Join Technocore` linkini ac.
4. `Publish DID` linkini ac.
5. `Register Contribution` linkini ac.
6. `Announce Contribution` ve gerekiyorsa `Announce Meta` linklerini ac.
7. `Create Signed Mailbox` linkini ac.
8. Public proof metnini README veya katkı sayfasinda yayinla.

## Repo Proof

Katkinin belirli bir Git commit'e ait oldugunu gostermek icin:

```bash
npm run repo-proof -- --kit burak-technocore-proof-kit.json --repo https://github.com/burak33bb/flop-technocore-agent-tool --commit <commit-sha> --out repo-proof.public.json
```

Bu komut public bir JSON uretir. JSON icindeki `verified: true`, imzanin DID public key'i ile dogrulandigini gosterir.

## Dikkat

Canli Technocore linklerini acmak public kayit olusturur. Gercek katkı linki hazir olmadan yayin linklerini calistirma.
