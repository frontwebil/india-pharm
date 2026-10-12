import AdminOrderFormPage from "@/components/AdminPage/AdminOrderFormPage";

export const dynamic = "force-dynamic";

export default async function AdminEditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <AdminOrderFormPage orderId={id} />;
}
