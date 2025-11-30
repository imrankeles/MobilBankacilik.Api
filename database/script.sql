IF NOT EXISTS(SELECT name FROM sys.databases WHERE name = 'MobilBankacilik')
BEGIN
    CREATE DATABASE [MobilBankacilik]
END
GO

USE [MobilBankacilik]
GO

-- Kart t�rleri
IF NOT EXISTS(SELECT name FROM sys.tables WHERE name = 'KartTuru')
BEGIN
    CREATE TABLE [KartTuru] (
       [KartTuruId] INT IDENTITY(1,1) PRIMARY KEY,
       [KartTuruAdi] NVARCHAR(20) UNIQUE NOT NULL
    );

    INSERT INTO [KartTuru] ([KartTuruAdi])
    VALUES ('Kredi'), ('Debit');
END

-- Fatura t�rleri
IF NOT EXISTS (SELECT name FROM sys.tables WHERE name = 'FaturaTuru')
BEGIN
    CREATE TABLE [FaturaTuru] (
        [FaturaTuruId] INT IDENTITY(1,1) PRIMARY KEY,
        [FaturaTuruAdi] NVARCHAR(50) UNIQUE NOT NULL
    );
END

INSERT INTO [FaturaTuru] ([FaturaTuruAdi])
VALUES ('Elektrik'), ('Su'), ('Dogalgaz'), ('Internet'), ('Telefon');

-- Hesap durumu
IF NOT EXISTS (SELECT name FROM sys.tables WHERE name = 'Durum')
BEGIN
    CREATE TABLE [Durum] (
        [DurumId] INT IDENTITY(1,1) PRIMARY KEY,
        [DurumAdi] NVARCHAR(10) UNIQUE NOT NULL
    );
END

-- Kullan�c� tablosu
IF NOT EXISTS (SELECT name FROM sys.tables WHERE name = 'Kullanici')
BEGIN
    CREATE TABLE [Kullanici] (
        [UserId] INT IDENTITY(1,1) PRIMARY KEY,
        [Ad] NVARCHAR(50) NOT NULL,
        [Soyad] NVARCHAR(50) NOT NULL,
        [Email] NVARCHAR(100) UNIQUE NOT NULL,
        [Telefon] NVARCHAR(10) UNIQUE NOT NULL,
        [Sifre] NVARCHAR(255) NOT NULL,
        [TcNo] NVARCHAR(11) UNIQUE NOT NULL,
        [Adres] NVARCHAR(255) NULL,
        [KayitTarihi] DATETIME DEFAULT GETDATE()
    );
END

-- Hesap tablosu
IF NOT EXISTS(SELECT name FROM sys.tables WHERE name = 'Hesap')
BEGIN
    CREATE TABLE [Hesap] (
        [HesapId] INT IDENTITY(1,1) PRIMARY KEY,
        [UserId] INT NOT NULL,
        [IbanNo] NVARCHAR(20) UNIQUE NOT NULL,
        [HesapTuru] NVARCHAR(50) NOT NULL,
        [Bakiye] DECIMAL(18,2) DEFAULT 0,
        [AcilisTarihi] DATETIME DEFAULT GETDATE(),
        [DurumId] INT DEFAULT 1,
        CONSTRAINT [FK_Hesap_Kullanici]
        FOREIGN KEY ([UserId]) REFERENCES [Kullanici]([UserId]),
        CONSTRAINT [FK_Hesap_Durum] FOREIGN KEY ([DurumId]) REFERENCES [Durum]([DurumId])
    );
END

-- Kart tablosu
IF NOT EXISTS(SELECT name FROM sys.tables WHERE name = 'Kart')
BEGIN
    CREATE TABLE [Kart] (
        [KartId] INT IDENTITY(1,1) PRIMARY KEY,
        [UserId] INT NOT NULL,
        [KartNo] NVARCHAR(16) UNIQUE NOT NULL,
        [SonKullanma] NVARCHAR(8) NOT NULL,
        [Cvv] NVARCHAR(3) NOT NULL,
        [KartTuruId] INT NOT NULL,
        [LimitMiktari] DECIMAL(18,2) NULL,
        [Bakiye] DECIMAL(18,2) NULL,
        [DurumId] INT DEFAULT 1,

        CONSTRAINT [FK_Kart_Kullanici] FOREIGN KEY ([UserId]) REFERENCES [Kullanici]([UserId]),
        CONSTRAINT [FK_Kart_Turu] FOREIGN KEY ([KartTuruId]) REFERENCES [KartTuru]([KartTuruId]),
        CONSTRAINT [FK_Kart_Durum] FOREIGN KEY ([DurumId]) REFERENCES [Durum]([DurumId])
    );
END

-- Fatura tablosu
IF NOT EXISTS(SELECT name FROM sys.tables WHERE name = 'Fatura')
BEGIN
    CREATE TABLE [Fatura] (
        [FaturaId] INT IDENTITY(1,1) PRIMARY KEY,
        [UserId] INT NOT NULL,
        [FaturaTuruId] INT NOT NULL,
        [KurumAdi] NVARCHAR(100) NULL,
        [Tutar] DECIMAL(18,2) NOT NULL,
        [SonOdemeTarihi] DATE NOT NULL,
        [OdemeTarihi] DATETIME NULL,
        [DurumId] INT DEFAULT 1,

        CONSTRAINT [FK_Fatura_Kullanici] FOREIGN KEY ([UserId]) REFERENCES [Kullanici]([UserId]),
        CONSTRAINT [FK_Fatura_Turu] FOREIGN KEY ([FaturaTuruId]) REFERENCES [FaturaTuru]([FaturaTuruId]),
        CONSTRAINT [FK_Fatura_Durum] FOREIGN KEY ([DurumId]) REFERENCES [Durum]([DurumId])
    );
END

-- ��lem tablosu
IF NOT EXISTS(SELECT name FROM sys.tables WHERE name = 'Islem')
BEGIN
    CREATE TABLE [Islem] (
        [IslemId] INT IDENTITY(1,1) PRIMARY KEY,
        [HesapId] INT NOT NULL,
        [IslemTuru] NVARCHAR(50) NOT NULL,
        [Tutar] DECIMAL(18,2) NOT NULL,
        [Tarih] DATETIME DEFAULT GETDATE(),
        [Aciklama] NVARCHAR(255) NULL,
        [HedefHesap] NVARCHAR(20) NULL,
        [IsExpense] BIT NOT NULL,
        [IsSpending] BIT NOT NULl,
        CONSTRAINT [FK_Islem_Hesap] FOREIGN KEY ([HesapId]) REFERENCES [Hesap]([HesapId])
    );
END

-- Giri� kay�tlar�
IF NOT EXISTS(SELECT name FROM sys.tables WHERE name = 'LoginLog')
BEGIN
    CREATE TABLE [LoginLog] (
        [LogId] INT IDENTITY(1,1) PRIMARY KEY,
        [UserId] INT NOT NULL,
        [GirisZamani] DATETIME DEFAULT GETDATE(),
        [CihazBilgisi] NVARCHAR(100) NULL,
        [IpAdresi] NVARCHAR(45) NULL,
        CONSTRAINT [FK_Log_Kullanici] FOREIGN KEY ([UserId]) REFERENCES [Kullanici]([UserId])
    );
END
GO

-- �ndeksler
CREATE INDEX [IX_Kullanici_TcNo] ON [Kullanici]([TcNo]);
CREATE INDEX [IX_Hesap_Iban] ON [Hesap]([IbanNo]);
CREATE INDEX [IX_Fatura_Turu] ON [Fatura]([FaturaTuruId]);
GO

-- Trigger (bakiye kontrol�)
CREATE TRIGGER [Trg_BakiyeKontrol]
ON [Islem]
AFTER INSERT
AS
BEGIN
    DECLARE @HesapId INT, @Tutar DECIMAL(18,2);
    SELECT @HesapId = [HesapId], @Tutar = [Tutar] FROM inserted;

    IF EXISTS (
        SELECT 1 FROM Hesap WHERE [HesapId] = @HesapId AND [Bakiye] < @Tutar
    )
    BEGIN
        RAISERROR('Yetersiz bakiye! ��lem iptal edildi.', 16, 1);
        ROLLBACK TRANSACTION;
END
END
