
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Package, Users, ShoppingCart,
  Plus, Trash2, Pencil, Search, CheckCircle
} from "lucide-react";
import "./App.css";

const readData = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
};

// Gọi API trên Vercel. Khi chạy localhost,
// dữ liệu được xử lý bằng LocalStorage.
async function callApi(resource, method = "GET", data = null) {
  if (["localhost", "127.0.0.1"].includes(location.hostname)) {
    return { success: true };
  }

  const response = await fetch(`/api/${resource}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(data ? { body: JSON.stringify(data) } : {})
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "API có lỗi");
  }

  return result;
}

function App() {
  const [tab, setTab] = useState("dashboard");

  const [products, setProducts] = useState(() => readData("products"));
  const [customers, setCustomers] = useState(() => readData("customers"));
  const [orders, setOrders] = useState(() => readData("orders"));

  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [apiStatus, setApiStatus] = useState("Đang kiểm tra API");

  const [form, setForm] = useState({
    name: "",
    price: "",
    phone: "",
    address: ""
  });

  const [orderForm, setOrderForm] = useState({
    customerId: "",
    productId: "",
    quantity: 1
  });

  useEffect(() => {
    Promise.all([
      callApi("products"),
      callApi("customers"),
      callApi("orders")
    ])
      .then(() => setApiStatus("API hoạt động"))
      .catch(() => setApiStatus("API chưa kết nối"));
  }, []);

  const saveData = (key, data, setter) => {
    localStorage.setItem(key, JSON.stringify(data));
    setter(data);
  };

  const money = (value) =>
    Number(value).toLocaleString("vi-VN") + " đ";

  const resetForm = () => {
    setForm({ name: "", price: "", phone: "", address: "" });
    setEditing(null);
  };

  const updateForm = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resource = tab === "products" ? "products" : "customers";
  const currentList = tab === "products" ? products : customers;
  const currentSetter = tab === "products" ? setProducts : setCustomers;

  // Thêm và sửa sản phẩm hoặc khách hàng
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isProduct = tab === "products";

    if (!form.name.trim()) {
      alert("Vui lòng nhập tên!");
      return;
    }

    if (isProduct && (!form.price || Number(form.price) <= 0)) {
      alert("Vui lòng nhập giá hợp lệ!");
      return;
    }

    if (!isProduct && !form.phone.trim()) {
      alert("Vui lòng nhập số điện thoại!");
      return;
    }

    const data = isProduct
      ? { name: form.name, price: Number(form.price) }
      : {
          name: form.name,
          phone: form.phone,
          address: form.address
        };

    try {
      if (editing !== null) {
        await callApi(resource, "PUT", { id: editing, ...data });

        const updated = currentList.map(item =>
          item.id === editing ? { ...item, ...data } : item
        );

        saveData(resource, updated, currentSetter);
        alert("Cập nhật thành công!");
      } else {
        await callApi(resource, "POST", data);

        const updated = [
          ...currentList,
          { id: Date.now(), ...data }
        ];

        saveData(resource, updated, currentSetter);
        alert("Thêm thành công!");
      }

      resetForm();
    } catch (error) {
      alert("Lỗi: " + error.message);
    }
  };

  // Chọn dữ liệu để sửa
  const editItem = (item) => {
    setEditing(item.id);

    setForm({
      name: item.name || "",
      price: item.price || "",
      phone: item.phone || "",
      address: item.address || ""
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Xóa sản phẩm hoặc khách hàng
  const deleteItem = async (type, id) => {
    if (!window.confirm("Bạn có chắc muốn xóa?")) return;

    const list = type === "products" ? products : customers;
    const setter = type === "products" ? setProducts : setCustomers;

    try {
      await callApi(type, "DELETE", { id });

      saveData(
        type,
        list.filter(item => item.id !== id),
        setter
      );

      alert("Xóa thành công!");
    } catch (error) {
      alert(error.message);
    }
  };

  // Tạo đơn hàng
  const createOrder = async (e) => {
    e.preventDefault();

    const customer = customers.find(
      c => c.id === Number(orderForm.customerId)
    );

    const product = products.find(
      p => p.id === Number(orderForm.productId)
    );

    const quantity = Number(orderForm.quantity);

    if (!customer || !product || quantity < 1) {
      alert("Vui lòng chọn khách hàng, sản phẩm và số lượng!");
      return;
    }

    const order = {
      id: Date.now(),
      customer: customer.name,
      product: product.name,
      quantity,
      total: product.price * quantity,
      date: new Date().toLocaleDateString("vi-VN"),
      status: "Đang xử lý"
    };

    try {
      await callApi("orders", "POST", order);

      saveData("orders", [...orders, order], setOrders);

      setOrderForm({
        customerId: "",
        productId: "",
        quantity: 1
      });

      alert("Tạo đơn hàng thành công!");
    } catch (error) {
      alert(error.message);
    }
  };

  // Cập nhật trạng thái đơn hàng
  const updateOrder = async (order) => {
    const updatedOrder = {
      ...order,
      status: order.status === "Đang xử lý"
        ? "Đã hoàn thành"
        : "Đang xử lý"
    };

    try {
      await callApi("orders", "PUT", updatedOrder);

      saveData(
        "orders",
        orders.map(o => o.id === order.id ? updatedOrder : o),
        setOrders
      );
    } catch (error) {
      alert(error.message);
    }
  };

  // Xóa đơn hàng
  const deleteOrder = async (id) => {
    if (!window.confirm("Bạn muốn xóa đơn hàng này?")) return;

    try {
      await callApi("orders", "DELETE", { id });

      saveData(
        "orders",
        orders.filter(o => o.id !== id),
        setOrders
      );
    } catch (error) {
      alert(error.message);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const menu = [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { id: "products", label: "Sản phẩm", icon: Package },
    { id: "customers", label: "Khách hàng", icon: Users },
    { id: "orders", label: "Đơn hàng", icon: ShoppingCart }
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>SHOP HOANG VO</h2>
        <p className="sidebar-subtitle">HỆ THỐNG BÁN HÀNG</p>

        {menu.map(item => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              className={tab === item.id ? "active" : ""}
              onClick={() => {
                setTab(item.id);
                setSearch("");
                resetForm();
              }}
            >
              <Icon size={19} />
              {item.label}
            </button>
          );
        })}

        <p className="api-status">
          <span className="status-dot"></span>
          {apiStatus}
        </p>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>Hệ thống quản lý bán hàng</h1>
            <p>Quản lý sản phẩm, khách hàng và đơn hàng</p>
          </div>
        </header>

        {tab === "dashboard" && (
          <>
            <h2>Tổng quan</h2>

            <div className="cards">
              <div className="card">
                <Package />
                <p>Tổng sản phẩm</p>
                <h2>{products.length}</h2>
              </div>

              <div className="card">
                <Users />
                <p>Tổng khách hàng</p>
                <h2>{customers.length}</h2>
              </div>

              <div className="card">
                <ShoppingCart />
                <p>Tổng đơn hàng</p>
                <h2>{orders.length}</h2>
              </div>
            </div>

            <section className="panel">
              <h3>Đơn hàng gần đây</h3>
              <table>
                <thead>
                  <tr>
                    <th>Khách hàng</th>
                    <th>Sản phẩm</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.slice(-5).reverse().map(o => (
                    <tr key={o.id}>
                      <td>{o.customer}</td>
                      <td>{o.product}</td>
                      <td>{money(o.total)}</td>
                      <td>{o.status}</td>
                    </tr>
                  ))}

                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="4">Chưa có đơn hàng</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}

        {(tab === "products" || tab === "customers") && (
          <>
            <h2>
              {tab === "products"
                ? "Quản lý sản phẩm"
                : "Quản lý khách hàng"}
            </h2>

            <form className="panel form" onSubmit={handleSubmit}>
              <h3>{editing !== null ? "Cập nhật thông tin" : "Thêm mới"}</h3>

              <input
                name="name"
                placeholder={
                  tab === "products"
                    ? "Tên sản phẩm"
                    : "Tên khách hàng"
                }
                value={form.name}
                onChange={updateForm}
                required
              />

              {tab === "products" ? (
                <input
                  name="price"
                  type="number"
                  min="1"
                  placeholder="Giá sản phẩm"
                  value={form.price}
                  onChange={updateForm}
                  required
                />
              ) : (
                <>
                  <input
                    name="phone"
                    placeholder="Số điện thoại"
                    value={form.phone}
                    onChange={updateForm}
                    required
                  />

                  <input
                    name="address"
                    placeholder="Địa chỉ"
                    value={form.address}
                    onChange={updateForm}
                  />
                </>
              )}

              <div className="form-actions">
                <button className="primary" type="submit">
                  <Plus size={17} />
                  {editing !== null ? "Lưu thay đổi" : "Thêm mới"}
                </button>

                {editing !== null && (
                  <button
                    type="button"
                    className="cancel"
                    onClick={resetForm}
                  >
                    Hủy
                  </button>
                )}
              </div>
            </form>

            <section className="panel">
              <div className="list-header">
                <h3>Danh sách</h3>

                <div className="search">
                  <Search size={18} />
                  <input
                    placeholder="Tìm kiếm..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <table>
                <thead>
                  {tab === "products" ? (
                    <tr>
                      <th>Tên sản phẩm</th>
                      <th>Giá</th>
                      <th>Thao tác</th>
                    </tr>
                  ) : (
                    <tr>
                      <th>Khách hàng</th>
                      <th>Điện thoại</th>
                      <th>Địa chỉ</th>
                      <th>Thao tác</th>
                    </tr>
                  )}
                </thead>

                <tbody>
                  {tab === "products" ? (
                    filteredProducts.map(p => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{money(p.price)}</td>
                        <td className="actions">
                          <button className="edit" onClick={() => editItem(p)}>
                            <Pencil size={15} /> Sửa
                          </button>
                          <button
                            className="delete"
                            onClick={() => deleteItem("products", p.id)}
                          >
                            <Trash2 size={15} /> Xóa
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    filteredCustomers.map(c => (
                      <tr key={c.id}>
                        <td>{c.name}</td>
                        <td>{c.phone}</td>
                        <td>{c.address}</td>
                        <td className="actions">
                          <button className="edit" onClick={() => editItem(c)}>
                            <Pencil size={15} /> Sửa
                          </button>
                          <button
                            className="delete"
                            onClick={() => deleteItem("customers", c.id)}
                          >
                            <Trash2 size={15} /> Xóa
                          </button>
                        </td>
                      </tr>
                    ))
                  )}

                  {currentList.length === 0 && (
                    <tr>
                      <td colSpan="4">Chưa có dữ liệu</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}

        {tab === "orders" && (
          <>
            <h2>Quản lý đơn hàng</h2>

            <form className="panel order-form" onSubmit={createOrder}>
              <h3>Tạo đơn hàng mới</h3>

              <select
                value={orderForm.customerId}
                onChange={e => setOrderForm({
                  ...orderForm,
                  customerId: e.target.value
                })}
                required
              >
                <option value="">-- Chọn khách hàng --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={orderForm.productId}
                onChange={e => setOrderForm({
                  ...orderForm,
                  productId: e.target.value
                })}
                required
              >
                <option value="">-- Chọn sản phẩm --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {money(p.price)}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                value={orderForm.quantity}
                onChange={e => setOrderForm({
                  ...orderForm,
                  quantity: e.target.value
                })}
                required
              />

              <button className="primary" type="submit">
                <Plus size={17} /> Tạo đơn hàng
              </button>
            </form>

            <section className="panel">
              <h3>Danh sách đơn hàng</h3>

              <table>
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Khách hàng</th>
                    <th>Sản phẩm</th>
                    <th>Số lượng</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td>#{o.id}</td>
                      <td>{o.customer}</td>
                      <td>{o.product}</td>
                      <td>{o.quantity}</td>
                      <td>{money(o.total)}</td>
                      <td>{o.status}</td>
                      <td className="actions">
                        <button
                          className="edit"
                          onClick={() => updateOrder(o)}
                        >
                          <CheckCircle size={15} /> Đổi trạng thái
                        </button>
                        <button
                          className="delete"
                          onClick={() => deleteOrder(o.id)}
                        >
                          <Trash2 size={15} /> Xóa
                        </button>
                      </td>
                    </tr>
                  ))}

                  {orders.length === 0 && (
                    <tr>
                      <td colSpan="7">Chưa có đơn hàng</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
