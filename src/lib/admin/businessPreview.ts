import type { BusinessOverview, BusinessOrder } from "./business";
import type { MenuItem } from "@/lib/menuStore";
import type { Review } from "@/lib/reviewStore";
import type { ChatThread, ChatMessage } from "@/lib/chatStore";
import type { ShopNotice } from "@/lib/shopStore";

export interface BusinessDemoState {
  version: 1;
  overview: BusinessOverview;
  menu: MenuItem[];
  orders: BusinessOrder[];
  reviews: Review[];
  threads: ChatThread[];
  messages: Record<string, ChatMessage[]>;
  notices: ShopNotice[];
}

export function createBusinessDemoState(
  overview: BusinessOverview,
): BusinessDemoState {
  const at = overview.generatedAt;
  const names = ["Бат-Эрдэнэ", "Номин", "Саруул"];
  const menu: MenuItem[] = [
    {
      id: "demo-menu-1",
      category: "Гол хоол",
      name: "Хуушуур",
      desc: "Шинэхэн махтай хуушуур · 4 ширхэг",
      price: "12,000₩",
    },
    {
      id: "demo-menu-2",
      category: "Гол хоол",
      name: "Бууз",
      desc: "Монгол бууз · 8 ширхэг",
      price: "15,000₩",
    },
    {
      id: "demo-menu-3",
      category: "Уух зүйл",
      name: "Сүүтэй цай",
      desc: "Халуун сүүтэй цай",
      price: "4,000₩",
    },
  ];
  const orders = Array.from({ length: 8 }, (_, index): BusinessOrder => ({
    id: `DEMO-ORDER-${String(index + 1).padStart(3, "0")}`,
    category: "restaurant",
    shopName: overview.shop.name,
    customerName: names[index % 3],
    createdAt: at,
    status:
      index < 5 ? "pending" : ["received", "delivered", "cancelled"][index - 5],
    payload: JSON.stringify({
      items: [
        { name: menu[index % 3].name, price: menu[index % 3].price, qty: 2 },
      ],
      subtotalAmount: 24000,
      customer: {
        name: names[index % 3],
        phone: "010-0000-0000",
        address: "서울시 중구 · Туршилтын хаяг",
      },
      notes: "Туршилтын захиалга.",
    }),
  }));
  const reviews: Review[] = names.map((name, index) => ({
    id: `demo-review-${index}`,
    shopId: overview.shop.id,
    userId: `demo-customer-${index}`,
    userName: name,
    rating: index === 1 ? 4 : 5,
    comment: [
      "Маш амттай байлаа. Дахин захиална!",
      "Хоол сайхан байлаа. Баярлалаа.",
      "Хурдан хүргэлттэй, амттай байна.",
    ][index],
    createdAt: at,
    ...(index === 2
      ? { reply: "Баярлалаа! Дахин үйлчлүүлээрэй.", replyAt: at }
      : {}),
  }));
  const threads: ChatThread[] = names.map((name, index) => ({
    id: `demo-thread-${index}`,
    shopId: overview.shop.id,
    shopName: overview.shop.name,
    userId: `demo-customer-${index}`,
    userName: name,
    lastMessageAt: at,
    lastMessagePreview: [
      "Өнөөдөр хэдэн цаг хүртэл ажиллах вэ?",
      "Хүргэлт хийдэг үү?",
      "Ширээ захиалж болох уу?",
    ][index],
    unread: true,
  }));
  const messages = Object.fromEntries(
    threads.map((thread) => [
      thread.id,
      [
        {
          id: `${thread.id}-message-1`,
          threadId: thread.id,
          from: "user" as const,
          text: thread.lastMessagePreview,
          createdAt: at,
        },
      ],
    ]),
  );
  return {
    version: 1,
    overview,
    menu,
    orders,
    reviews,
    threads,
    messages,
    notices: [
      {
        id: "demo-notice-1",
        title: "Манай ресторан нээлттэй",
        content: "Өдөр бүр 11:00–22:00 цагийн хооронд үйлчилж байна.",
        createdAt: at,
      },
      {
        id: "demo-notice-2",
        title: "Шинэ цэс нэмэгдлээ",
        content: "Монгол амттай хоолнуудыг амтлаарай.",
        createdAt: at,
      },
    ],
  };
}

export function demoOverview(state: BusinessDemoState): BusinessOverview {
  return {
    ...state.overview,
    shop: {
      ...state.overview.shop,
      notices: state.notices,
      reviewCount: 38,
      avgRating: 4.8,
    },
    totals: {
      ...state.overview.totals,
      orders: 284 + state.orders.length - 8,
      pending: state.orders.filter((order) => order.status === "pending")
        .length,
      unread: state.threads.filter((thread) => thread.unread).length,
      unreplied: state.reviews.filter((review) => !review.reply).length,
    },
    recentOrders: state.orders.slice(0, 5),
  };
}

/** An explicit in-memory adapter: unknown requests fail closed and never use fetch. */
export function businessPreviewRequest(
  state: BusinessDemoState,
  input: string,
  init?: RequestInit,
): { data: unknown; next?: BusinessDemoState } {
  if (!input.startsWith("/api/"))
    throw new Error("Туршилтад гадаад хүсэлт дэмжихгүй.");
  const url = new URL(input, "https://preview.invalid");
  const path = url.pathname;
  const method = init?.method?.toUpperCase() ?? "GET";
  const body = init?.body
    ? (JSON.parse(String(init.body)) as Record<string, unknown>)
    : {};
  const next = structuredClone(state);
  const now = new Date().toISOString();
  const id = () => "demo-" + crypto.randomUUID();
  const finish = (data: unknown, changed = false) => ({
    data,
    ...(changed ? { next } : {}),
  });
  function paginate<T>(rows: T[], key: string) {
    const page = Math.max(
      1,
      Math.floor(Number(url.searchParams.get("page")) || 1),
    );
    const limit = Math.max(
      1,
      Math.min(50, Number(url.searchParams.get("limit")) || 15),
    );
    return finish({
      [key]: rows.slice((page - 1) * limit, page * limit),
      page,
      limit,
      total: rows.length,
    });
  }
  if (path === "/api/biz/overview" && method === "GET")
    return finish(demoOverview(state));
  if (path === "/api/biz/orders" && method === "GET") {
    const q = (url.searchParams.get("q") ?? "").toLowerCase();
    const status = url.searchParams.get("status") || "all";
    return paginate(
      state.orders.filter(
        (order) =>
          (status === "all" || order.status === status) &&
          (order.id + " " + order.customerName).toLowerCase().includes(q),
      ),
      "orders",
    );
  }
  if (path === "/api/biz/chats" && method === "GET") {
    const q = (url.searchParams.get("q") ?? "").toLowerCase();
    return paginate(
      state.threads.filter(
        (thread) =>
          (url.searchParams.get("unread") !== "true" || thread.unread) &&
          (thread.userName + " " + thread.lastMessagePreview)
            .toLowerCase()
            .includes(q),
      ),
      "threads",
    );
  }
  if (path === "/api/reviews" && method === "GET") {
    const offset = Number(url.searchParams.get("cursor")) || 0;
    return finish({
      reviews: state.reviews.slice(offset, offset + 20),
      nextCursor:
        state.reviews.length > offset + 20 ? String(offset + 20) : null,
    });
  }
  const reviewMatch = path.match(/^\/api\/reviews\/([^/]+)\/reply$/);
  if (reviewMatch) {
    const review = next.reviews.find((row) => row.id === reviewMatch[1]);
    if (!review || !["POST", "DELETE"].includes(method))
      throw new Error("Туршилтын үнэлгээ олдсонгүй.");
    review.reply =
      method === "DELETE" ? undefined : String(body.reply ?? "").trim();
    review.replyAt = method === "DELETE" ? undefined : now;
    return finish({ ok: true }, true);
  }
  const orderMatch = path.match(/^\/api\/orders\/([^/]+)\/status$/);
  if (orderMatch && method === "POST") {
    const order = next.orders.find((row) => row.id === orderMatch[1]);
    if (
      !order ||
      !["pending", "received", "in_transit", "delivered", "cancelled"].includes(
        String(body.status),
      )
    )
      throw new Error("Захиалгын төлөвийг шалгана уу.");
    order.status = String(body.status);
    return finish({ order }, true);
  }
  const threadMatch = path.match(/^\/api\/chat\/threads\/([^/]+)\/messages$/);
  if (threadMatch) {
    const thread = next.threads.find((row) => row.id === threadMatch[1]);
    if (!thread) throw new Error("Чат олдсонгүй.");
    thread.unread = false;
    if (method === "POST") {
      const text = String(body.text ?? "").trim();
      if (!text) throw new Error("Мессеж оруулна уу.");
      next.messages[thread.id].push({
        id: id(),
        threadId: thread.id,
        from: "shop",
        text,
        createdAt: now,
      });
      thread.lastMessageAt = now;
      thread.lastMessagePreview = text;
    } else if (method !== "GET")
      throw new Error("Туршилт энэ үйлдлийг дэмжихгүй.");
    return finish({ messages: next.messages[thread.id] }, true);
  }
  const shopRoot = "/api/shops/" + encodeURIComponent(state.overview.shop.id);
  if (path === shopRoot && method === "PATCH") {
    const allowed = [
      "name",
      "description",
      "contactPhone",
      "address",
      "openHours",
      "facebook",
      "instagram",
      "bankAccount",
      "deliveryFee",
      "specialty",
    ] as const;
    const shop = next.overview.shop;
    for (const key of allowed)
      if (body[key] !== undefined) Object.assign(shop, { [key]: body[key] });
    if (body.deliveryFee === null) delete shop.deliveryFee;
    if (body.specialty === null) delete shop.specialty;
    return finish({ shop }, true);
  }
  if (path === shopRoot + "/toggle-open" && method === "POST") {
    next.overview.shop.isOpen = next.overview.shop.isOpen === false;
    return finish({ shop: next.overview.shop }, true);
  }
  if (path === shopRoot + "/images" && method === "POST") {
    next.overview.shop.images = [
      ...(next.overview.shop.images ?? []),
      String(body.r2Key),
    ];
    return finish({ ok: true }, true);
  }
  if (path.startsWith(shopRoot + "/images/") && method === "DELETE") {
    const image = decodeURIComponent(
      path.slice((shopRoot + "/images/").length),
    );
    next.overview.shop.images = next.overview.shop.images?.filter(
      (key) => key !== image,
    );
    return finish({ ok: true }, true);
  }
  for (const resource of ["menu", "notices"] as const) {
    const root = shopRoot + "/" + resource;
    if (path !== root && !path.startsWith(root + "/")) continue;
    const rows = resource === "menu" ? next.menu : next.notices;
    const itemId = path.slice(root.length + 1);
    const resultKey = resource === "menu" ? "item" : "notice";
    if (method === "GET")
      return finish(resource === "menu" ? { items: rows } : { notices: rows });
    if (method === "POST" && path === root) {
      const item = {
        ...body,
        id: id(),
        ...(resource === "notices" ? { createdAt: now } : {}),
      };
      if (resource === "menu") next.menu.push(item as unknown as MenuItem);
      else next.notices.unshift(item as unknown as ShopNotice);
      return finish({ [resultKey]: item }, true);
    }
    const item = rows.find((row) => row.id === itemId);
    if (!item) throw new Error("Туршилтын мэдээлэл олдсонгүй.");
    if (method === "PATCH") {
      Object.assign(item, body, { id: itemId });
      return finish({ [resultKey]: item }, true);
    }
    if (method === "DELETE") {
      if (resource === "menu")
        next.menu = next.menu.filter((row) => row.id !== itemId);
      else next.notices = next.notices.filter((row) => row.id !== itemId);
      return finish({ ok: true }, true);
    }
  }
  throw new Error("Урьдчилан харах горимд энэ боломж дэмжигдэхгүй.");
}
