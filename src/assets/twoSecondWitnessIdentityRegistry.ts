import witnessEmblemSvg from '../../assets/application-identities/two-second-witness/optimized/witness-emblem.svg?raw';
import streetCornerSvg from '../../assets/application-identities/two-second-witness/optimized/street-corner.svg?raw';
import dinerCounterSvg from '../../assets/application-identities/two-second-witness/optimized/diner-counter.svg?raw';
import transitPlatformSvg from '../../assets/application-identities/two-second-witness/optimized/transit-platform.svg?raw';
import studyDeskSvg from '../../assets/application-identities/two-second-witness/optimized/study-desk.svg?raw';
import umbrellaSvg from '../../assets/application-identities/two-second-witness/optimized/prop-umbrella.svg?raw';
import busSvg from '../../assets/application-identities/two-second-witness/optimized/prop-bus.svg?raw';
import mugSvg from '../../assets/application-identities/two-second-witness/optimized/prop-mug.svg?raw';
import suitcaseSvg from '../../assets/application-identities/two-second-witness/optimized/prop-suitcase.svg?raw';
import ticketSvg from '../../assets/application-identities/two-second-witness/optimized/prop-ticket.svg?raw';
import scarfSvg from '../../assets/application-identities/two-second-witness/optimized/prop-scarf.svg?raw';
import bookSvg from '../../assets/application-identities/two-second-witness/optimized/prop-book.svg?raw';
import lampSvg from '../../assets/application-identities/two-second-witness/optimized/prop-lamp.svg?raw';
import plantSvg from '../../assets/application-identities/two-second-witness/optimized/prop-plant.svg?raw';
import clockSvg from '../../assets/application-identities/two-second-witness/optimized/prop-clock.svg?raw';

/**
 * Archived clean-room Two Second Witness artwork, isolated from Coo’s Joint and shared icon batches.
 * The published /experiences/twosecondwitness/ route is a static showcase and does not load this
 * registry or a local gameplay preview; the records remain for provenance and asset tests.
 */
function witnessAsset(
  manifestAssetId: string,
  filename: string,
  optimizedFilename: string,
  width: number,
  height: number,
  svgMarkup: string,
) {
  return {
    manifestAssetId,
    sourcePath: filename,
    optimizedPath: optimizedFilename,
    format: 'svg' as const,
    width,
    height,
    svgMarkup,
  };
}

const root = 'application-identities/two-second-witness';
const source = `${root}/source`;
const optimized = `${root}/optimized`;

export const twoSecondWitnessAssets = {
  emblem: witnessAsset('NC-2SW-01', `${source}/witness-emblem.svg`, `${optimized}/witness-emblem.svg`, 180, 180, witnessEmblemSvg),
  scenes: {
    streetCorner: witnessAsset('NC-2SW-02', `${source}/street-corner.svg`, `${optimized}/street-corner.svg`, 720, 320, streetCornerSvg),
    dinerCounter: witnessAsset('NC-2SW-03', `${source}/diner-counter.svg`, `${optimized}/diner-counter.svg`, 720, 320, dinerCounterSvg),
    transitPlatform: witnessAsset('NC-2SW-04', `${source}/transit-platform.svg`, `${optimized}/transit-platform.svg`, 720, 320, transitPlatformSvg),
    studyDesk: witnessAsset('NC-2SW-05', `${source}/study-desk.svg`, `${optimized}/study-desk.svg`, 720, 320, studyDeskSvg),
  },
  props: {
    umbrella: witnessAsset('NC-2SW-06', `${source}/prop-umbrella.svg`, `${optimized}/prop-umbrella.svg`, 96, 96, umbrellaSvg),
    bus: witnessAsset('NC-2SW-07', `${source}/prop-bus.svg`, `${optimized}/prop-bus.svg`, 96, 96, busSvg),
    mug: witnessAsset('NC-2SW-08', `${source}/prop-mug.svg`, `${optimized}/prop-mug.svg`, 96, 96, mugSvg),
    suitcase: witnessAsset('NC-2SW-09', `${source}/prop-suitcase.svg`, `${optimized}/prop-suitcase.svg`, 96, 96, suitcaseSvg),
    ticket: witnessAsset('NC-2SW-10', `${source}/prop-ticket.svg`, `${optimized}/prop-ticket.svg`, 96, 96, ticketSvg),
    scarf: witnessAsset('NC-2SW-11', `${source}/prop-scarf.svg`, `${optimized}/prop-scarf.svg`, 96, 96, scarfSvg),
    book: witnessAsset('NC-2SW-12', `${source}/prop-book.svg`, `${optimized}/prop-book.svg`, 96, 96, bookSvg),
    lamp: witnessAsset('NC-2SW-13', `${source}/prop-lamp.svg`, `${optimized}/prop-lamp.svg`, 96, 96, lampSvg),
    plant: witnessAsset('NC-2SW-14', `${source}/prop-plant.svg`, `${optimized}/prop-plant.svg`, 96, 96, plantSvg),
    clock: witnessAsset('NC-2SW-15', `${source}/prop-clock.svg`, `${optimized}/prop-clock.svg`, 96, 96, clockSvg),
  },
} as const;
