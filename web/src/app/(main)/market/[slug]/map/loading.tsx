export default function MapLoading() {
  return (
    <div
      className="flex items-center justify-center bg-gray-50"
      style={{ height: "calc(100dvh - 112px)" }}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B20000] border-t-transparent" />
    </div>
  );
}
