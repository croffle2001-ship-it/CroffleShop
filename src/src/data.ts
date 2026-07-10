import { Product, Order, InventoryItem } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-original",
    name: "ครอฟเฟิล ออริจินอล",
    price: 20,
    category: "ขนม",
    image: "/src/assets/images/original_croffle_1783439268565.jpg",
    description: "ครอฟเฟิลอบร้อนกรอบนอกนุ่มใน หอมเนยแท้ระดับพรีเมียม อร่อยแบบออริจินอลต้นตำรับ",
    isMustTry: true,
    isBestSeller: false,
    toppings: [],
    inStock: true
  },
  {
    id: "prod-1",
    name: "คาราเมล อัลม่อน",
    price: 29,
    category: "ขนม",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBmiFx1juSots1IXuIXWVS9s8tb2KMWXglCTmDrWVcFtNGhfOH1p3zI31rU3_FHURbRPA_sYkj1Eecw7vk_U7Zc7PXNDnM1SqwDcDkgNslBgDS1bETUURsU-oV6QQxpBHADaferBenNy7qUrybppKjw7HvsA7fcMf3yiTrpi_DEX9L2SuYghx-_pGTNAVufbyeJWapMf11TUR_0XVo0NrThpcRNGCTUfVhbACOyPKmfZFRvpk8aydDSOGjKcvsK-yxJhHPjNzIbUnEw",
    description: "ครอฟเฟิลอบร้อนราดด้วยซอสคาราเมลหอมหวาน ท็อปปิ้งด้วยอัลมอนด์อบสไลด์กรุบกรอบอร่อยลงตัว",
    isMustTry: true,
    isBestSeller: false,
    toppings: [
      { name: "หน้าเดิม", price: 0 },
      { name: "อัลมอนด์อบกรอบ", price: 0 },
      { name: "โอริโอ้", price: 0 },
      { name: "บราวนี่", price: 0 }
    ],
    inStock: true
  },
  {
    id: "prod-3",
    name: "วิปครีมบราวนี่",
    price: 35,
    category: "ขนม",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBEUB80c3x9997X08L65BbKzt9U3-20NeDSkMNkGh0h1G9MmpxMZsNjmKVv5zOl-dd0IAQWwRidPtL4WkOlCqio6SPfLHAksl_2D6ypKWY9SwgiznLldFKS08JtAXXddEbNqL4NAHdFw_PJjESA1pRoexm--zkB3G93jVHfi6b-hOCtP8WOaw3X6_0q4BMjaYHQQMGShZhDZxYe88aLos_bYw2hI13MSl3OLvxYhntixWoorPNxWtx2tC87vCzhRtgPB3mAptnG7qje",
    description: "วิปครีมนุ่มละมุนพูนๆ ออนท็อปด้วยบราวนี่หนึบหนับแสนอร่อย ทานคู่กับครอฟเฟิลร้อนๆ ฟินมาก",
    isMustTry: false,
    isBestSeller: true,
    rank: 1,
    customTag: "ขายดีอันดับ 1!",
    toppings: [
      { name: "หน้าเดิม", price: 0 },
      { name: "อัลมอนด์อบกรอบ", price: 0 },
      { name: "โอริโอ้", price: 0 },
      { name: "บราวนี่", price: 0 }
    ],
    inStock: true
  },
  {
    id: "prod-4",
    name: "มัทฉะ อัลม่อน",
    price: 29,
    category: "ขนม",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAtFFFEtf-_ZvvEvamI8U7vtGV9HDZHcslHJqNpEDuZlpsarzJb99hpwBcjRN5vYpOiWmCWPIaiSNrNetV9xkO75_OrREfQjRVV1VhZzZC9N4wNag0jbQXf0fgVFaZFN18u4e0MeCCc9Tp5yF1HmVC5tNbj185X0HyWy6YZknsfth4hlR02JEBG-bZr7EPllMDLMzgDZkqmZEKNiMu_raB6P4IDIzWmbG0HkgK6MYzHj6xfKeFAYtv7TkjySjrW8236ohfUtaOEipFl",
    description: "ซอสมัทฉะแท้เข้มข้นสไตล์ญี่ปุ่น ทาเคลือบบนครอฟเฟิลอบใหม่ โรยหน้าด้วยอัลมอนด์อบสไลด์เต็มพิกัด",
    isMustTry: false,
    isBestSeller: false,
    toppings: [
      { name: "หน้าเดิม", price: 0 },
      { name: "อัลมอนด์อบกรอบ", price: 0 },
      { name: "โอริโอ้", price: 0 },
      { name: "บราวนี่", price: 0 }
    ],
    inStock: true
  },
  {
    id: "prod-5",
    name: "ไวท์ช็อกโอริโอ้",
    price: 29,
    category: "ขนม",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDbM143lI-fu5dThRCUO3aKYPDIg0fOcyvHHZoFGGc8ZwXVetmOG71OI_c4pG0U-bq1a4jXDwzG5VlFc53J1YKu1BuwQXdlhfJpoOPFrCsCQVW-H5JYddDCzV4rwuQ560a4hh5FoWBnGujLw79I2SXU5KAApD--9bUae0KxvIZNKCVg04pOqrbMD2pf7OjuSj7-ZltYF6DKGRkj0Q2hCErt3EFe9i2JaAuhiojf5_vCKzC-Psf5nJK0Hh9MRXrCxZr0TT6TY_9j45yp",
    description: "ซอสไวท์ช็อกโกแลตหวานละมุนราดเยิ้มๆ โรยหน้าด้วยคุกกี้โอรีโอ้บดกรุบกรอบ อร่อยเต็มคำ",
    isMustTry: false,
    isBestSeller: false,
    toppings: [
      { name: "หน้าเดิม", price: 0 },
      { name: "อัลมอนด์อบกรอบ", price: 0 },
      { name: "โอริโอ้", price: 0 },
      { name: "บราวนี่", price: 0 }
    ],
    inStock: true
  },
  {
    id: "prod-6",
    name: "ดับเบิ้ลช็อก",
    price: 29,
    category: "ขนม",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCrweHJ9W6ViUgm101U-GYYl6ve-l-mdNUmMunYEKW_JkFzCWg7S6-fL61-4P4r5y3kbaYVWlekmRWzy_J_mDn0ftHr5A2_jBkxh8zWyyVYVat67SbcuMH103zHE_M6LG63fk8hYt7xxXmOLEYKfg3NX91Cqak6fie99ThVx9qlOT9yIcwki1LRBS7v0VsLw1tQRfVOGIISplwWwM072z4FkoBQ6H_KlQVOAGlsKJDrVOWSixI4DMz2R51fzoJei6YzzktHtmeYF5fH",
    description: "ครอฟเฟิลช็อกโกแลตเข้มข้น ดับเบิ้ลความอร่อยด้วยซอสช็อกโกแลตราดซ้ำอย่างชุ่มฉ่ำ สะใจคนรักช็อกโกแลต",
    isMustTry: false,
    isBestSeller: false,
    toppings: [
      { name: "หน้าเดิม", price: 0 },
      { name: "อัลมอนด์อบกรอบ", price: 0 },
      { name: "โอริโอ้", price: 0 },
      { name: "บราวนี่", price: 0 }
    ],
    inStock: true
  },
  {
    id: "prod-7",
    name: "นูเทล่า",
    price: 29,
    category: "ขนม",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD77UdCga69EdrseDnWee3FpEIVzNMTi_E2Y1VJ11jfr7L2bHbqG7a9tl_GyKUcWsMTCT6eYoWHJlcFI7zkGClEa2oJgqcNHT2xCmZSiNHkTygw0EJDDgfr4sXYNjDd6ZqrQUpMv28pu7umo2tlrGWBYSYdN0mNPnROFaDnKUPczRPo6AxhjDqPrrdaYPIRpct69UQmRLnx7DwTKSDLgYqGGSHYiJor8H4t7VRwcih33fqml-OseSAfhBA49_QkCSi4AEz0ZsdkJt1p",
    description: "ครอฟเฟิลอบกรอบ ทานูเทลล่าแท้รสชาติเข้มข้นระดับพรีเมียม หอมมันอร่อยฟินเต็มเตา",
    isMustTry: false,
    isBestSeller: true,
    toppings: [
      { name: "หน้าเดิม", price: 0 },
      { name: "อัลมอนด์อบกรอบ", price: 0 },
      { name: "โอริโอ้", price: 0 },
      { name: "บราวนี่", price: 0 }
    ],
    inStock: true
  },
  {
    id: "prod-8",
    name: "นูเทล่าอัลม่อน",
    price: 35,
    category: "ขนม",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA8GQ_FA79Wo1n-A8ETaIsquvIQGQ_zkcTzMkr82UzygexrgPdTAQm_x_VfOdV5XHK8aAuKczVCEYGjllKEvlfIeKSCOmzjrjQcT0dnFpHrvCUYoF_IWkqh00qkTtJaX4GyOcLjR7fk3ZGDMtafLZtwl87eT6vNJk0u-Csx8-Zi0Q_qC-C3SeO_JjwVpjvuZykZEAobP1FPWGRiHO9yUf_K39ku3AQMApn4PD-arzrJ2kbkqXxvBVVB2xNMc03zhGKdffTltTDvfwbP",
    description: "ส่วนผสมที่สมบูรณ์แบบ นูเทลล่าพรีเมียมเข้มข้นโรยหน้าด้วยอัลมอนด์อบสไลด์กรอบมัน เคี้ยวเพลินหอมกร่อยอร่อยฟิน",
    isMustTry: false,
    isBestSeller: false,
    toppings: [
      { name: "หน้าเดิม", price: 0 },
      { name: "อัลมอนด์อบกรอบ", price: 0 },
      { name: "โอริโอ้", price: 0 },
      { name: "บราวนี่", price: 0 }
    ],
    inStock: true
  },
  {
    id: "prod-9",
    name: "โอวัลตินมิลกี้",
    price: 29,
    category: "ขนม",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB7P9mfrO46Ex8pZXljZckLll5Y_SJZmZMAy5fyBs78nJ7WLsFzJpmZBvTrGvqK1h9baCKKpp0fMZ0d3kVHx1GFsqsae7Hee_INlR02ytwdkGQNNUHs5uphTlm1JKzhGurNywCcuSGrTSY9UhjnKWR5QjbhU5cJCCicbn6bg9DX7_NteT15sqnnwuyuFc6qdwGTYVIJT8uVSw6GiyYCp4bnIvmnUVW7ElfXgCjynEpJVi257ZCmpEolEqW40ptZVL1jPUOXv23-76Xq",
    description: "ครอฟเฟิลอบร้อนราดซสนมข้นมิลกี้หอมหวาน คลุกเคล้าผงโอวัลตินเข้มข้นอร่อยนัวสไตล์วันวาน",
    isMustTry: false,
    isBestSeller: false,
    toppings: [
      { name: "หน้าเดิม", price: 0 },
      { name: "อัลมอนด์อบกรอบ", price: 0 },
      { name: "โอริโอ้", price: 0 },
      { name: "บราวนี่", price: 0 }
    ],
    inStock: true
  },
  {
    id: "prod-10",
    name: "ทูโทรน",
    price: 29,
    category: "ขนม",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBejUJkho1yTIo7IxHea1gFAIIh8f3P8BCo7HQxKq92F0cfnZOxEginDipicCwwnCInBok6H5dld-T6vWcBAjLB8AXTz6SU-goE4Kb_UBbaihMAWd6b1hlj8tPPmTk830jztwZC6TmiAGeb7lHYUE0jClPk0NfPQRmDgQSukVYvCypbpekmK0tOXRGd0ISepuyHKYnv1q8ur3HUe0wtxRdfCspvgctEEl2mrjbuJ37Jrbd0-z0eYVAcsjjJeEZVyJN2mAQs6F4NJzfJ",
    description: "ครอฟเฟิลสไตล์ทูโทน (Two-Tone) ผสานราดซอสไวท์ช็อกและดาร์กช็อกโกแลตสลับลายอย่างสวยงามและลงตัว",
    isMustTry: false,
    isBestSeller: false,
    toppings: [],
    inStock: true
  },
  {
    id: "prod-11",
    name: "ช็อกโกแลต อัลม่อน",
    price: 29,
    category: "ขนม",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC5wzK0_qdY6z9wp-gAukxBPny2s83xAUMvmBxotP44YpORag-ciyR4xhf56ko24zuX_yzRn43JAsfd3XFzO7L4kDZGY4HJDowhvnnFUY3GvyydJXO-r0yyhmFZ1RZwg1xfXQZpZFK8xXK26zURMbbAyl-SJKECGOHJ5F8dBvSa21PvLptn9jc8RjxGU44z5kzfEfepI2ThOOr3PqIotkVEZW8OaxFs5UD9lT_JC2aHRpWEJ3005vNDytBtaVRwuutdFAM45c-peYqX",
    description: "ครอฟเฟิลราดซอสช็อกโกแลตนมสูตรเข้มข้นออริจินัลของทางร้าน โรยด้วยหน้าอัลมอนด์อบสไลด์กรอบๆ",
    isMustTry: false,
    isBestSeller: false,
    toppings: [
      { name: "หน้าเดิม", price: 0 },
      { name: "อัลมอนด์อบกรอบ", price: 0 },
      { name: "โอริโอ้", price: 0 },
      { name: "บราวนี่", price: 0 }
    ],
    inStock: true
  },
  {
    id: "prod-12",
    name: "น้ำตาล ไอซิ่ง",
    price: 25,
    category: "ขนม",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBDLViZ91kN58DkoucnWavX3aM3pHOo30j0c4MUVI0wrcIjqrDg04mQyLvlcr0q4nBMZsTFpdWeYxVaVArLiYM_UFFl_flEWaA1AUa-tLdvEE6nUDKWkUHZl8qWXvRhKYOMDrj5jm0qTF1pKOKA7k0h60KjgyeJr6zWylTwPO2KL3UOPHyi_bNzoD_rjYlUDPY78lfa3d0adwRnPlF67tmIay8wBqKqBaeVzoWlVMzKcGxp1dUWclrTaT7Bxob2VVnFQ_WkccEi9Xmz",
    description: "ครอฟเฟิลอบกรอบเคลือบน้ำตาลคาราเมลบางๆ โรยด้วยหน้าผงน้ำตาลไอซิ่งหอมละมุนสไตล์คลาสสิก",
    isMustTry: false,
    isBestSeller: false,
    toppings: [],
    inStock: true
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: "#4401",
    customerName: "คุณส้มโอ",
    roomNo: "ตึก A ชั้น 5 ห้อง 502",
    phone: "089-123-4567",
    items: [
      { productName: "นูเทล่า", quantity: 2, price: 29, optionsSummary: "เพิ่มอัลมอนด์อบสไลด์ (+฿10)" },
      { productName: "คาราเมล อัลม่อน", quantity: 2, price: 29, optionsSummary: "หวานปกติ" }
    ],
    totalPrice: 136,
    status: "Preparing",
    createdAt: "2026-07-06 10:30",
    note: "ฝากไว้ที่เคาน์เตอร์นิติคอนโดชั้นล่างสุดนะคะ"
  },
  {
    id: "#4402",
    customerName: "คุณก้อง",
    roomNo: "ตึก B ชั้น 3 ห้อง 315",
    phone: "081-987-6543",
    items: [
      { productName: "นูเทล่าอัลม่อน", quantity: 1, price: 35, optionsSummary: "ราดซอสช็อกโกแลตเพิ่ม (+฿5)" },
      { productName: "ไวท์ช็อกโอริโอ้", quantity: 1, price: 29, optionsSummary: "หวานปกติ" }
    ],
    totalPrice: 69,
    status: "Pending",
    createdAt: "2026-07-06 10:45",
    note: "ระวังอย่าใส่ถั่วเหลืองเยอะเกินไปครับ ขอบคุณครับ"
  },
  {
    id: "#4399",
    customerName: "คุณเมย์",
    roomNo: "ตึก C ชั้น 12 ห้อง 1204",
    phone: "085-555-6789",
    items: [
      { productName: "คาราเมล อัลม่อน", quantity: 3, price: 29, optionsSummary: "วิปครีมพรีเมียม (+฿10)" },
      { productName: "โอวัลตินมิลกี้", quantity: 2, price: 29, optionsSummary: "สูตรปกติ" }
    ],
    totalPrice: 175,
    status: "Delivered",
    createdAt: "2026-07-06 09:12",
    note: "ส่งถึงหน้าห้องได้เลยค่า ประตูไม่ได้ล็อก เคาะเรียกแล้ววางไว้ได้เลย"
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: "inv-2",
    name: "แป้งครัวซองต์ดิบ (Croffle Dough)",
    stockText: "แป้งครัวซองต์แน่นสต็อก (100 ชิ้น)",
    status: "normal",
    icon: "Croissant"
  },
  {
    id: "inv-nutella",
    name: "ซอสนูเทลล่า (Nutella Sauce)",
    stockText: "มีสต็อกเพียงพอสำหรับสัปดาห์นี้",
    status: "normal",
    icon: "Layers"
  },
  {
    id: "inv-almond",
    name: "อัลมอนด์สไลด์อบ (Sliced Almond)",
    stockText: "เหลือน้อย (ต่ำกว่า 0.5 กิโลกรัม)",
    status: "low",
    icon: "Layers"
  },
  {
    id: "inv-brownie",
    name: "บราวนี่หั่นเต๋า (Chewy Brownie)",
    stockText: "มีสต็อกเพียงพอ (2 กิโลกรัม)",
    status: "normal",
    icon: "Layers"
  },
  {
    id: "inv-oreo",
    name: "โอริโอ้บดกรอบ (Crushed Oreo)",
    stockText: "มีสต็อกเพียงพอ (1.5 กิโลกรัม)",
    status: "normal",
    icon: "Layers"
  }
];
