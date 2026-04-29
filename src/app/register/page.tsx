import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RegisterForm } from "@/components/RegisterForm";

export default async function RegisterPage(props: {
  searchParams: Promise<{ error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const errorMsg = searchParams?.error;

  const signup = async (formData: FormData) => {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const deviceId = formData.get("deviceId") as string;
    const className = formData.get("className") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          device_id: deviceId || null,
          class_name: className || null,
        },
      },
    });

    if (error) {
      redirect("/register?error=" + encodeURIComponent(error.message));
    }

    // Immediately reserve the device ID in the pcs table so it shows up for the admin
    // and correctly reserves the auto-increment number.
    if (deviceId) {
      await supabase.from("pcs").upsert(
        {
          id: deviceId,
          name: deviceId,
          status: "offline",
          last_seen: new Date(0).toISOString(), // Epoch time so it immediately shows as offline
        },
        { onConflict: "id" },
      );
    }

    redirect("/");
  };

  /**
   * Returns the next auto-incremented device ID for a given class.
   * Checks the pcs table (names like 301-A-1, 301-A-2).
   */
  const getNextDeviceId = async (className: string): Promise<string> => {
    "use server";
    const supabase = await createClient();
    const prefix = `${className}-`;

    const { data: pcsData } = await supabase
      .from("pcs")
      .select("name")
      .like("name", `${prefix}%`);

    if (!pcsData || pcsData.length === 0) return `${prefix}1`;

    // Extract numeric suffixes and find the max
    const nums = pcsData
      .map((row) => {
        const id = row.name;
        if (!id || !id.startsWith(prefix)) return 0;
        const n = parseInt(id.slice(prefix.length), 10);
        return isNaN(n) ? 0 : n;
      })
      .filter((n) => n > 0);

    const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `${prefix}${nextNum}`;
  };

  return (
    <>
      <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
        <ThemeToggle />
      </div>
      <RegisterForm
        errorMsg={errorMsg}
        signup={signup}
        getNextDeviceId={getNextDeviceId}
      />
    </>
  );
}
