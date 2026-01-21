import { X, Loader2, Bug } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";

interface ReportBugModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
}

export function ReportBugModal({
  isOpen,
  onClose,
  userEmail,
  userName,
}: ReportBugModalProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("https://api.formdrop.co/f/P4AObh0E", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userName || "Anonymous",
          email: userEmail || "anonymous@example.com",
          message: message,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });

      if (response.ok) {
        toast.success("Bug report sent successfully! We'll look into it.");
        setMessage("");
        onClose();
      } else {
        throw new Error("Failed to send report");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to send bug report. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                    <Bug className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      Report a Bug
                    </h2>
                    <p className="text-sm text-white/40">
                      Found an issue? Let us know so we can fix it.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-3">
                  <label
                    htmlFor="message"
                    className="text-sm font-medium text-white/60"
                  >
                    Describe the issue
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Please describe the bug you encountered. Include steps to reproduce if possible..."
                    className="mt-2 w-full h-64 bg-black/40 border border-white/10 rounded-xl p-4 text-base text-white placeholder:text-white/20 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 resize-none transition-all"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="px-6 py-2.5 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-white/5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Report"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
