"use client";

import { useRouter, useSearchParams } from "next/navigation";

const normalize = (value) => String(value || "").trim();

export default function SortSelect({ defaultValue = "newest" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onChange = (e) => {
    const next = normalize(e.target.value) || "newest";
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");

    if (next === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", next);
    }

    const qs = params.toString();
    router.push(qs ? `/properties?${qs}` : "/properties");
  };

  return (
    <select defaultValue={defaultValue} className="input" style={{ padding: "9px 10px" }} onChange={onChange}>
      <option value="newest">Newest</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
    </select>
  );
}
