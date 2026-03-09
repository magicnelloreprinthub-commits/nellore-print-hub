import { motion } from "motion/react";

const socialLinks = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/share/18JBSHpEKX/?mibextid=wwXIfr",
    icon: "https://cdn-icons-png.flaticon.com/512/733/733547.png",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/nelloreprinthub?igsh=aGNvZWlzdno0emVm&utm_source=qr",
    icon: "https://cdn-icons-png.flaticon.com/512/2111/2111463.png",
  },
  {
    name: "Threads",
    href: "https://www.threads.com/@nelloreprinthub?igshid=NTc4MTIwNjQ2YQ==",
    icon: "https://cdn-icons-png.flaticon.com/512/825/825564.png",
  },
  {
    name: "Pinterest",
    href: "https://pin.it/6ZaHsuLxq",
    icon: "https://cdn-icons-png.flaticon.com/512/2111/2111499.png",
  },
  {
    name: "Flickr",
    href: "https://flickr.com/photos/204271528@N02/sets/72177720332245331",
    icon: "https://cdn-icons-png.flaticon.com/512/733/733609.png",
  },
];

export default function FloatingSocial() {
  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 items-center">
      {socialLinks.map((social, idx) => (
        <motion.a
          key={social.name}
          href={social.href}
          target="_blank"
          rel="noopener noreferrer"
          data-ocid={`social.link.${idx + 1}`}
          aria-label={social.name}
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{
            delay: 1.5 + idx * 0.1,
            type: "spring",
            stiffness: 200,
          }}
          whileHover={{ x: -4, scale: 1.15 }}
          className="w-10 h-10 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-200 border border-gray-200 hover:border-gray-400 shadow-xs"
        >
          <img
            src={social.icon}
            alt={social.name}
            style={{ height: "22px", width: "22px" }}
          />
        </motion.a>
      ))}
    </div>
  );
}
