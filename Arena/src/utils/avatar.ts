import { rtdb, auth } from "../firebase";
import { ref, update } from "firebase/database";

/**
 * Downscale a picked image to a square JPEG data URL. Avatars are stored on the
 * user's Realtime Database record, so they need to stay small.
 */
export const fileToAvatarDataUrl = (file: File, max = 256): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load that image."));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement("canvas");
        canvas.width = max;
        canvas.height = max;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process that image."));
          return;
        }
        ctx.drawImage(
          img,
          (img.width - side) / 2,
          (img.height - side) / 2,
          side,
          side,
          0,
          0,
          max,
          max,
        );
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

export const saveAvatar = async (dataUrl: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("You need to be signed in.");
  await update(ref(rtdb, `users/${user.uid}`), { photoURL: dataUrl });
};
