import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.event.deleteMany();
  await prisma.colony.deleteMany();
  await prisma.apiary.deleteMany();
  await prisma.settings.deleteMany();

  // Create or find test user
  const testUser = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Test Biodlare",
      hashedPassword: "$2a$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptJ/op0lSsvqNu/1u", // password: "test123"
    },
  });

  const userId = testUser.id;

  // Create apiaries
  const dungen = await prisma.apiary.create({
    data: {
      userId,
      namn: "Dungen",
      adress: "Dungens gård, 123 45 Skogsbo",
      latitude: 59.3293,
      longitude: 18.0686,
      beskrivning: "Liten bigård vid skogsbrynet, skyddad från vind.",
    },
  });

  const krattorpEken = await prisma.apiary.create({
    data: {
      userId,
      namn: "Krattorp Eken",
      adress: "Krattorpsvägen 12, 123 45 Landsbygden",
      latitude: 59.4,
      longitude: 17.9,
      beskrivning: "Huvudbigård vid den gamla eken. Soligt läge.",
    },
  });

  const kroken = await prisma.apiary.create({
    data: {
      userId,
      namn: "Kroken",
      adress: "Krokvägen 5, 123 46 Ängsvik",
      latitude: 59.35,
      longitude: 18.1,
      beskrivning: "Bigård vid åkanten med bra dragväxter.",
    },
  });

  const mjolkladan = await prisma.apiary.create({
    data: {
      userId,
      namn: "Mjölkladan",
      adress: "Ladugårdsvägen 8, 123 47 Bondby",
      latitude: 59.28,
      longitude: 18.05,
      beskrivning: "Äldre ladugård ombyggd till bigård. Skydd mot regn.",
    },
  });

  const odeby = await prisma.apiary.create({
    data: {
      userId,
      namn: "Ödeby",
      adress: "Ödebyvägen 1, 123 48 Ödemark",
      latitude: 59.45,
      longitude: 17.85,
      beskrivning: "Avlägsen bigård för avläggare och reserv.",
    },
  });

  console.log("Created 5 apiaries");

  // Create colonies
  const colonies = [
    // Dungen - 3 samhällen
    {
      userId,
      bigardId: dungen.id,
      namn: "Dungen 1",
      platsNummer: 1,
      drottningRas: "Buckfast",
      drottningAr: 2023,
      drottningVingklippt: false,
      kupaTyp: "Stapling",
      ramTypYngelrum: "Farrar 3/4 Langstroth",
      ramTypSkattlador: "Farrar 3/4 Langstroth",
      status: "Aktiv",
    },
    {
      userId,
      bigardId: dungen.id,
      namn: "Dungen 2",
      platsNummer: 2,
      drottningRas: "Carnica",
      drottningAr: 2022,
      drottningVingklippt: true,
      kupaTyp: "Stapling",
      ramTypYngelrum: "Langstroth djup",
      ramTypSkattlador: "Farrar 3/4 Langstroth",
      status: "Aktiv",
    },
    {
      userId,
      bigardId: dungen.id,
      namn: "Dungen 3",
      platsNummer: 3,
      drottningRas: "Buckfast",
      drottningAr: 2021,
      kupaTyp: "Stapling",
      status: "Förlorat",
      anteckningar: "Förlorat vintern 2024/2025, troligen svältdöd.",
    },

    // Krattorp Eken - 5 samhällen
    {
      userId,
      bigardId: krattorpEken.id,
      namn: "Krattorp 1",
      platsNummer: 1,
      drottningRas: "Buckfast",
      drottningAr: 2024,
      kupaTyp: "Stapling",
      ramTypYngelrum: "Farrar 3/4 Langstroth",
      status: "Aktiv",
    },
    {
      userId,
      bigardId: krattorpEken.id,
      namn: "Krattorp 2",
      platsNummer: 2,
      drottningRas: "Buckfast",
      drottningAr: 2023,
      drottningVingklippt: true,
      kupaTyp: "Stapling",
      ramTypYngelrum: "Farrar 3/4 Langstroth",
      status: "Aktiv",
      anteckningar: "Mycket produktivt samhälle.",
    },
    {
      userId,
      bigardId: krattorpEken.id,
      namn: "Krattorp 3",
      platsNummer: 3,
      drottningRas: "Carnica",
      drottningAr: 2023,
      kupaTyp: "Vandringskupa",
      status: "Aktiv",
    },
    {
      userId,
      bigardId: krattorpEken.id,
      namn: "Krattorp 4",
      platsNummer: 4,
      drottningRas: "Nordbi",
      drottningAr: 2022,
      kupaTyp: "Stapling",
      status: "Aktiv",
    },
    {
      userId,
      bigardId: krattorpEken.id,
      namn: "Krattorp 5",
      platsNummer: 5,
      drottningRas: "Buckfast",
      drottningAr: 2024,
      kupaTyp: "Stapling",
      status: "Aktiv",
      anteckningar: "Avläggare från Krattorp 2.",
    },

    // Kroken - 4 samhällen
    {
      userId,
      bigardId: kroken.id,
      namn: "Kroken 1",
      platsNummer: 1,
      drottningRas: "Italienska",
      drottningAr: 2023,
      kupaTyp: "Stapling",
      status: "Aktiv",
    },
    {
      userId,
      bigardId: kroken.id,
      namn: "Kroken 2",
      platsNummer: 2,
      drottningRas: "Buckfast",
      drottningAr: 2022,
      kupaTyp: "Stapling",
      status: "Aktiv",
    },
    {
      userId,
      bigardId: kroken.id,
      namn: "Kroken 3",
      platsNummer: 3,
      drottningRas: "Carnica",
      drottningAr: 2024,
      kupaTyp: "Stapling",
      status: "Aktiv",
    },
    {
      userId,
      bigardId: kroken.id,
      namn: "Kroken 4",
      platsNummer: 4,
      drottningRas: "Buckfast",
      drottningAr: 2021,
      kupaTyp: "Stapling",
      status: "Avyttrat",
      anteckningar: "Sålt till biodlare i grannbyn.",
    },

    // Mjölkladan - 3 samhällen
    {
      userId,
      bigardId: mjolkladan.id,
      namn: "Mjölkladan 1",
      platsNummer: 1,
      drottningRas: "Buckfast",
      drottningAr: 2023,
      kupaTyp: "Trågkupa",
      status: "Aktiv",
    },
    {
      userId,
      bigardId: mjolkladan.id,
      namn: "Mjölkladan 2",
      platsNummer: 2,
      drottningRas: "Nordbi",
      drottningAr: 2024,
      kupaTyp: "Trågkupa",
      status: "Aktiv",
    },
    {
      userId,
      bigardId: mjolkladan.id,
      namn: "Mjölkladan 3",
      platsNummer: 3,
      drottningRas: "Carnica",
      drottningAr: 2022,
      kupaTyp: "Stapling",
      status: "Sammanslagen",
      anteckningar: "Sammanslagen med Mjölkladan 1 hösten 2024.",
    },

    // Ödeby - 2 samhällen
    {
      userId,
      bigardId: odeby.id,
      namn: "Ödeby 1",
      platsNummer: 1,
      drottningRas: "Buckfast",
      drottningAr: 2024,
      kupaTyp: "Stapling",
      status: "Aktiv",
    },
    {
      userId,
      bigardId: odeby.id,
      namn: "Ödeby 2",
      platsNummer: 2,
      drottningRas: "Carnica",
      drottningAr: 2024,
      kupaTyp: "Stapling",
      status: "Aktiv",
      anteckningar: "Ny avläggare 2024.",
    },
  ];

  const createdColonies = [];
  for (const colony of colonies) {
    const created = await prisma.colony.create({
      data: colony,
    });
    createdColonies.push(created);
  }

  console.log(`Created ${createdColonies.length} colonies`);

  // Create events for some colonies
  const eventData = [
    // Events for Krattorp 1
    {
      userId,
      samhalleId: createdColonies[3].id,
      handelseTyp: "Inspektion",
      datum: new Date("2024-05-15"),
      data: JSON.stringify({
        styrka: "Starkt",
        temperament: "Lugnt",
        drottningSynlig: true,
        drottningceller: false,
        anteckningar: "Bra utveckling, 8 ramar yngel.",
      }),
    },
    {
      userId,
      samhalleId: createdColonies[3].id,
      handelseTyp: "Skörd",
      datum: new Date("2024-07-10"),
      data: JSON.stringify({
        mangdKg: 18.5,
        antalRamar: 10,
        anteckningar: "Ljus sommarhonung.",
      }),
    },
    {
      userId,
      samhalleId: createdColonies[3].id,
      handelseTyp: "Hälsoåtgärd",
      datum: new Date("2024-08-01"),
      data: JSON.stringify({
        atgardstyp: "Varroabehandling",
        metodPreparat: "Myrsyra",
        anteckningar: "Första behandlingen efter skörd.",
      }),
    },
    {
      userId,
      samhalleId: createdColonies[3].id,
      handelseTyp: "Invintring",
      datum: new Date("2024-09-20"),
      data: JSON.stringify({
        antalRamar: 10,
        fodermangdKg: 18,
        allmanntSkick: "Starkt",
        anteckningar: "Bra invintringsläge.",
      }),
    },

    // Events for Krattorp 2
    {
      userId,
      samhalleId: createdColonies[4].id,
      handelseTyp: "Inspektion",
      datum: new Date("2024-04-20"),
      data: JSON.stringify({
        styrka: "Starkt",
        temperament: "Lugnt",
        drottningSynlig: true,
        drottningceller: false,
      }),
    },
    {
      userId,
      samhalleId: createdColonies[4].id,
      handelseTyp: "Avläggare",
      datum: new Date("2024-05-25"),
      data: JSON.stringify({
        nyttSamhalleSkapad: true,
        anteckningar: "Skapad avläggare - Krattorp 5.",
      }),
    },
    {
      userId,
      samhalleId: createdColonies[4].id,
      handelseTyp: "Skörd",
      datum: new Date("2024-07-12"),
      data: JSON.stringify({
        mangdKg: 25.2,
        antalRamar: 12,
        anteckningar: "Rekord för detta samhälle!",
      }),
    },
    {
      userId,
      samhalleId: createdColonies[4].id,
      handelseTyp: "Skörd",
      datum: new Date("2024-08-15"),
      data: JSON.stringify({
        mangdKg: 12.0,
        antalRamar: 6,
        anteckningar: "Andra skörd, mörk honung.",
      }),
    },

    // Events for Dungen 1
    {
      userId,
      samhalleId: createdColonies[0].id,
      handelseTyp: "Inspektion",
      datum: new Date("2024-06-01"),
      data: JSON.stringify({
        styrka: "Medel",
        temperament: "Neutralt",
        drottningSynlig: false,
        drottningceller: false,
        anteckningar: "Såg inte drottningen men bra yngelmönster.",
      }),
    },
    {
      userId,
      samhalleId: createdColonies[0].id,
      handelseTyp: "Skörd",
      datum: new Date("2024-07-20"),
      data: JSON.stringify({
        mangdKg: 14.0,
        antalRamar: 8,
      }),
    },
    {
      userId,
      samhalleId: createdColonies[0].id,
      handelseTyp: "Hälsoåtgärd",
      datum: new Date("2024-12-15"),
      data: JSON.stringify({
        atgardstyp: "Varroabehandling",
        metodPreparat: "Oxalsyra",
        anteckningar: "Vinterbehandling.",
      }),
    },

    // Events for Kroken 1
    {
      userId,
      samhalleId: createdColonies[8].id,
      handelseTyp: "Anteckning",
      datum: new Date("2024-04-01"),
      data: JSON.stringify({
        anteckningar: "Vårutveckling påbörjad, första utflygningen.",
      }),
    },
    {
      userId,
      samhalleId: createdColonies[8].id,
      handelseTyp: "Inspektion",
      datum: new Date("2024-05-10"),
      data: JSON.stringify({
        styrka: "Medel",
        temperament: "Lugnt",
        drottningSynlig: true,
        drottningceller: false,
      }),
    },
    {
      userId,
      samhalleId: createdColonies[8].id,
      handelseTyp: "Skörd",
      datum: new Date("2024-07-05"),
      data: JSON.stringify({
        mangdKg: 16.8,
        antalRamar: 9,
      }),
    },
  ];

  for (const event of eventData) {
    await prisma.event.create({
      data: event,
    });
  }

  console.log(`Created ${eventData.length} events`);

  // Create default settings for user
  await prisma.settings.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      foretagsnamn: "Min Biodling",
      organisationsnummer: "123456-7890",
      adress: "Bigårdsvägen 1",
      postnummer: "123 45",
      ort: "Bigårdsby",
      telefon: "070-123 45 67",
      epost: "biodling@example.com",
      bankgiro: "123-4567",
      swish: "0701234567",
      momsRegistrerad: true,
      nastaFakturaNummer: 1001,
    },
  });

  console.log("Created default settings");
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
