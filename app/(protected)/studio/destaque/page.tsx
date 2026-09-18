import type { Metadata } from "next";
import { revalidatePath } from "next/cache";

import { FeaturedManager } from "@/components/studio/featured/featured-manager";
import { StudioPageFrame } from "@/components/studio/layout/studio-page-frame";
import { requireStudioUser } from "@/lib/auth/session";
import {
  getStudioFeaturedSettings,
  listStudioFeaturedVideos,
  updateStudioFeaturedSettings,
  updateStudioFeaturedVideos,
} from "@/lib/studio/featured";

export const metadata: Metadata = { title: "Destaque | Academia Studio" };

export default async function StudioFeaturedPage() {
  await requireStudioUser();
  const [settings, videos] = await Promise.all([
    getStudioFeaturedSettings(),
    listStudioFeaturedVideos(),
  ]);

  async function updateSettingsAction(formData: FormData) {
    "use server";

    await requireStudioUser();
    await updateStudioFeaturedSettings(formData);
    revalidatePath("/");
    revalidatePath("/studio/destaque");
  }

  async function updateVideosAction(formData: FormData) {
    "use server";

    await requireStudioUser();
    await updateStudioFeaturedVideos(formData);
    revalidatePath("/");
    revalidatePath("/studio/destaque");
  }

  return (
    <StudioPageFrame>
      <FeaturedManager
        settings={settings}
        videos={videos}
        updateSettingsAction={updateSettingsAction}
        updateVideosAction={updateVideosAction}
      />
    </StudioPageFrame>
  );
}
