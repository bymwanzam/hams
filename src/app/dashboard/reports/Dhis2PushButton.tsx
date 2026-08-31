import { ConfirmButton } from "@/components/ui";
import { getDhis2Config } from "@/lib/dhis2";

// Header control for the three statutory reports. Renders nothing for
// non-admins; a disabled hint when DHIS2 isn't configured in .env; and
// otherwise a confirm dialog wrapping the report's "push to DHIS2" server
// action (passed in as `action`). Server component — it only chooses which
// control to show; ConfirmButton is the client piece.
export function Dhis2PushButton({
  action,
  reportTitle,
  from,
  to,
  isAdmin,
  facilityName,
}: {
  action: (formData: FormData) => void | Promise<void>;
  reportTitle: string;
  /** yyyy-mm-dd — mirrors the on-screen date range, submitted as hidden inputs. */
  from: string;
  to: string;
  isAdmin: boolean;
  facilityName: string;
}) {
  if (!isAdmin) return null;

  const config = getDhis2Config();
  if (!config) {
    return (
      <button
        type="button"
        disabled
        title="DHIS2 is not configured — set DHIS2_URL, DHIS2_TOKEN and DHIS2_ORG_UNIT in .env"
        className="btn btn-secondary"
      >
        Push to DHIS2
      </button>
    );
  }

  return (
    <ConfirmButton
      action={action}
      hidden={{ from, to }}
      variant="secondary"
      label="Push to DHIS2"
      confirmTitle="Push to DHIS2?"
      confirmBody={
        <>
          Send the <strong>{reportTitle}</strong> figures for{" "}
          <strong>{from}</strong> to <strong>{to}</strong> from{" "}
          <strong>{facilityName}</strong> to <code>{config.url}</code> (org
          unit <code>{config.orgUnit}</code>)
          {config.dryRun ? " as a dry run" : ""}. Existing values for this
          period will be overwritten.
        </>
      }
    />
  );
}
