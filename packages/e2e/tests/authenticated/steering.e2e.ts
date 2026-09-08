import { expect, test } from "@playwright/test";
import { seedSteeringTranscript } from "../../utils/steering-transcript";

test("ordinary steps expand with one click", async ({ page }) => {
  const id = await seedSteeringTranscript(false);
  await page.goto(`/app/logs/${id}`);
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "4 steps hidden", exact: true }).click();
  await expect(page.getByText("Inspecting the workspace.", { exact: true })).toBeVisible();
  await expect(page.getByText("Checking the preview.", { exact: true })).toBeVisible();
});

test("steering messages separate nested steps and their permalinks survive reload", async ({ page }) => {
  const id = await seedSteeringTranscript();
  await page.goto(`/app/logs/${id}`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator("aside").getByText("Use the local preview server.")).toHaveCount(0);
  await page.getByRole("button", { name: "4 steps, 1 steering message hidden", exact: true }).click();
  const steeringMessage = page.locator("#msg-4");
  await expect(steeringMessage).toContainText("Use the local preview server.");
  await expect(page.getByText("Inspecting the workspace.", { exact: true })).not.toBeVisible();
  const nestedGroups = page.getByRole("button", { name: "2 steps hidden", exact: true });
  await expect(nestedGroups).toHaveCount(2);
  await nestedGroups.first().click();
  await expect(page.getByText("Inspecting the workspace.", { exact: true })).toBeVisible();
  await expect(page.getByText("Checking the preview.", { exact: true })).not.toBeVisible();

  await steeringMessage.hover();
  await steeringMessage.getByTitle("Permalink").click();
  await expect(page).toHaveURL(new RegExp(`/app/logs/${id}#msg-4$`));
  await expect(page.locator("aside input")).toHaveValue(new RegExp("#msg-4$"));
  await page.reload();
  await expect(steeringMessage).toBeVisible();
  await expect(steeringMessage).toBeInViewport();
  await expect(page.getByRole("button", { name: "2 steps hidden", exact: true })).toHaveCount(2);
});
