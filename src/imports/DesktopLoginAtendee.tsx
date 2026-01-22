import svgPaths from "./svg-xnpfifjpab";
import imgLogo from "figma:asset/b80a222536e5acd2e9e6b97aa41bab4feddda6b4.png";
import imgImage3 from "figma:asset/7fd30e3b4334b9462db2adf0746adefd6b2405a7.png";

function AttendeeButton() {
  return (
    <div className="absolute bg-gradient-to-b from-[#77c76e] h-[1060px] left-0 rounded-[8px] to-[#38997a] top-[20px] w-[1920px]" data-name="Attendee Button">
      <div className="content-stretch flex gap-[8px] items-center justify-center overflow-clip p-[12px] rounded-[inherit] size-full" />
      <div aria-hidden="true" className="absolute border border-[#2a63c4] border-solid inset-0 pointer-events-none rounded-[8px]" />
    </div>
  );
}

function Group() {
  return (
    <div className="h-[67px] relative shrink-0 w-full">
      <div className="absolute bg-white border border-[rgba(0,0,0,0.2)] border-solid inset-0 rounded-[24px]" />
      <div className="absolute inset-[25.37%_75.26%_26.87%_8.25%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32.0001">
          <path d={svgPaths.p84a2000} fill="var(--fill-0, black)" id="Ellipse 6" />
        </svg>
      </div>
      <div className="absolute css-g0mm18 flex flex-col font-['Inter:Extra_Light',sans-serif] font-extralight inset-[29.85%_25.77%_31.34%_41.24%] justify-center leading-[0] not-italic text-[26px] text-black text-center tracking-[0.78px]">
        <p className="css-ew64yg leading-none">Light</p>
      </div>
    </div>
  );
}

function ThemeToggleDefault() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-[1672px] shadow-[0px_4px_5px_0px_rgba(0,0,0,0.25)] top-[69px] w-[194px]" data-name="Theme Toggle/Default">
      <Group />
    </div>
  );
}

function En() {
  return (
    <div className="absolute h-[18.909px] left-[calc(50%-0.81px)] top-[14.08px] translate-x-[-50%] w-[32.515px]" data-name="EN">
      <div className="absolute inset-[0_0_-0.01%_0]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32.516 18.9091">
          <g id="EN">
            <path d={svgPaths.p1d701b70} fill="var(--fill-0, black)" id="Vector" />
            <path d={svgPaths.p33ed3e80} fill="var(--fill-0, black)" id="Vector_2" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function LanguageBarVariant() {
  return (
    <div className="absolute bg-white border-[#e5e7eb] border-[0.832px] border-solid h-[49.639px] left-[1699px] rounded-[27905300px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] top-[-25.83px] w-[113.597px]" data-name="Language Bar/Variant3">
      <En />
    </div>
  );
}

function Container() {
  return (
    <div className="absolute border-[#e5e7eb] border-solid border-t-[0.832px] h-[49px] left-1/2 top-[calc(50%+515.5px)] translate-x-[-50%] translate-y-[-50%] w-[1920px]" data-name="Container">
      <p className="absolute css-ew64yg font-['Arimo:Regular',sans-serif] font-normal leading-[24px] left-1/2 text-[16px] text-center text-white top-[9.82px] translate-x-[-50%]">© 2025 SyncRekwest</p>
      <LanguageBarVariant />
    </div>
  );
}

function Logo() {
  return (
    <div className="absolute h-[222px] left-[665px] top-[84px] w-[591px]" data-name="Logo">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgLogo} />
    </div>
  );
}

export default function DesktopLoginAtendee() {
  return (
    <div className="bg-white relative size-full" data-name="Desktop - Login - Atendee">
      <AttendeeButton />
      <div className="absolute left-[750px] rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-[420px] top-[355px]" data-name="image 3">
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[15px]">
          <img alt="" className="absolute h-[99.95%] left-0 max-w-none top-[0.05%] w-full" src={imgImage3} />
        </div>
      </div>
      <ThemeToggleDefault />
      <div className="absolute bg-[#d9d9d9] h-[35px] left-0 top-0 w-[1920px]" data-name="Top Bar" />
      <Container />
      <Logo />
    </div>
  );
}