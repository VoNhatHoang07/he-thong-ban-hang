
export default function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method === "GET") {
    return res.status(200).json({
      success: true,
      message: "API khách hàng hoạt động",
      data: []
    });
  }

  if (req.method === "POST") {
    return res.status(201).json({
      success: true,
      message: "Thêm khách hàng thành công",
      data: req.body
    });
  }

  if (req.method === "PUT") {
    return res.status(200).json({
      success: true,
      message: "Cập nhật khách hàng thành công",
      data: req.body
    });
  }

  if (req.method === "DELETE") {
    return res.status(200).json({
      success: true,
      message: "Xóa khách hàng thành công"
    });
  }

  return res.status(405).json({
    success: false,
    message: "Phương thức không hợp lệ"
  });
}
