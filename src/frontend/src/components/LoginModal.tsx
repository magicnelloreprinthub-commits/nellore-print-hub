import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogIn, Phone, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRegisterOrLoginCustomer } from "../hooks/useQueries";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [errors, setErrors] = useState<{ name?: string; mobile?: string }>({});

  const registerOrLogin = useRegisterOrLoginCustomer();

  const validate = (): boolean => {
    const newErrors: { name?: string; mobile?: string } = {};
    if (!name.trim()) {
      newErrors.name = "Full name is required.";
    }
    const mobileDigits = mobile.replace(/\D/g, "");
    if (!mobile.trim()) {
      newErrors.mobile = "Mobile number is required.";
    } else if (mobileDigits.length < 10) {
      newErrors.mobile = "Enter at least 10 digits.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const customer = await registerOrLogin.mutateAsync({
        name: name.trim(),
        mobile: mobile.trim(),
      });

      // Serialize customer (bigints → strings) for localStorage
      const serialized = JSON.stringify({
        id: String(customer.id),
        name: customer.name,
        mobile: customer.mobile,
        visitCount: String(customer.visitCount),
        firstVisit: String(customer.firstVisit),
        lastVisit: String(customer.lastVisit),
      });

      localStorage.setItem("nph_customer", serialized);
      toast.success(`Welcome, ${customer.name}! You're signed in.`);

      // Dispatch welcome banner event
      window.dispatchEvent(
        new CustomEvent("customer-logged-in", {
          detail: { name: customer.name },
        }),
      );

      // Notify header to refresh
      window.dispatchEvent(new Event("customer-updated"));

      // Reset form and close
      setName("");
      setMobile("");
      setErrors({});
      onOpenChange(false);
    } catch {
      toast.error("Sign in failed. Please try again.");
    }
  };

  const inputClass =
    "h-11 rounded-xl border-white/12 bg-white/5 text-white placeholder:text-white/30 focus:border-[#e1306c]/50 focus:ring-[#e1306c]/20";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="login.dialog"
        className="border-[#833ab4]/30 rounded-2xl shadow-2xl max-w-sm w-full p-0 overflow-hidden"
        style={{ background: "rgba(10,5,20,0.98)" }}
      >
        {/* Brand gradient top accent bar */}
        <div
          className="h-1.5 w-full"
          style={{
            background:
              "linear-gradient(90deg, #833ab4, #e1306c, #fd1d1d, #fcb045)",
          }}
        />

        <div className="p-6">
          {/* FREE ACCESS badge */}
          <div className="flex justify-center mb-5">
            <span
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-white tracking-wide shadow-sm"
              style={{
                background: "linear-gradient(135deg, #833ab4, #e1306c)",
              }}
            >
              ✅ 100% FREE ACCESS — No Charges Ever
            </span>
          </div>

          <DialogHeader className="mb-5">
            <div className="flex items-center justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg brand-gradient">
                <LogIn className="w-6 h-6 text-white" />
              </div>
            </div>
            <DialogTitle className="text-xl font-bold text-white text-center">
              Welcome! Sign In Free
            </DialogTitle>
            <DialogDescription className="text-white/45 text-sm text-center mt-1">
              100% Free • No OTP • Just your name & number
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label
                htmlFor="login-name"
                className="text-white/70 text-sm font-medium"
              >
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <Input
                  id="login-name"
                  data-ocid="login.name.input"
                  type="text"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name)
                      setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  className={`pl-9 ${inputClass} ${errors.name ? "border-red-500/50 focus:border-red-500/50" : ""}`}
                  autoComplete="name"
                />
              </div>
              {errors.name && (
                <p
                  data-ocid="login.name.error_state"
                  className="text-red-400 text-xs mt-0.5"
                >
                  {errors.name}
                </p>
              )}
            </div>

            {/* Mobile */}
            <div className="space-y-1.5">
              <Label
                htmlFor="login-mobile"
                className="text-white/70 text-sm font-medium"
              >
                Mobile Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <Input
                  id="login-mobile"
                  data-ocid="login.mobile.input"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    if (errors.mobile)
                      setErrors((prev) => ({ ...prev, mobile: undefined }));
                  }}
                  className={`pl-9 ${inputClass} ${errors.mobile ? "border-red-500/50 focus:border-red-500/50" : ""}`}
                  autoComplete="tel"
                />
              </div>
              {errors.mobile && (
                <p
                  data-ocid="login.mobile.error_state"
                  className="text-red-400 text-xs mt-0.5"
                >
                  {errors.mobile}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              data-ocid="login.submit_button"
              disabled={registerOrLogin.isPending}
              className="w-full h-11 rounded-xl font-bold text-white text-sm mt-2 gap-2 transition-all duration-200 hover:scale-[1.01] border-0 brand-gradient"
            >
              {registerOrLogin.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In Free — No OTP
                </>
              )}
            </Button>

            <p className="text-xs text-white/30 text-center">
              No OTP required — instant access with your name & number
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
