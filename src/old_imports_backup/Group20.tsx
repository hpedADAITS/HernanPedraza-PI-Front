import svgPaths from "./svg-6s1919bydv";
type RatingProps = {
  className?: string;
  property1?: "Default" | "Thumbs Down";
};

function Rating({ className, property1 = "Default" }: RatingProps) {
  if (property1 === "Thumbs Down") {
    return (
      <div className={className} data-name="Property 1=Thumbs Down">
        <div className="absolute bg-[red] inset-0 rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]" />
        <div className="absolute flex inset-[18.75%_18.96%_18.75%_19.53%] items-center justify-center">
          <div className="flex-none h-[80.001px] rotate-[180deg] w-[78.731px]">
            <div className="relative size-full" data-name="Icon">
              <div className="absolute inset-[-5%_-10.16%_-15%_-10.16%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 94.7306 96.0005">
                  <g filter="url(#filter0_d_1_937)" id="Icon">
                    <path d={svgPaths.p24e3ba00} shapeRendering="crispEdges" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" />
                  </g>
                  <defs>
                    <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="96.0005" id="filter0_d_1_937" width="94.7306" x="0" y="0">
                      <feFlood floodOpacity="0" result="BackgroundImageFix" />
                      <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                      <feOffset dy="4" />
                      <feGaussianBlur stdDeviation="2" />
                      <feComposite in2="hardAlpha" operator="out" />
                      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                      <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_937" />
                      <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_937" mode="normal" result="shape" />
                    </filter>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={className} data-name="Property 1=Default">
      <div className="absolute bg-[#0004ff] inset-0 rounded-[10px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]" />
      <div className="absolute inset-[18.75%_18.96%_18.75%_19.53%]" data-name="Icon">
        <div className="absolute inset-[-5%_-10.16%_-15%_-10.16%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 94.7306 96.0005">
            <g filter="url(#filter0_d_1_931)" id="Icon">
              <path d={svgPaths.p24e3ba00} shapeRendering="crispEdges" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="8" />
            </g>
            <defs>
              <filter colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse" height="96.0005" id="filter0_d_1_931" width="94.7306" x="0" y="0">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" result="hardAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                <feOffset dy="4" />
                <feGaussianBlur stdDeviation="2" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
                <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_1_931" />
                <feBlend in="SourceGraphic" in2="effect1_dropShadow_1_931" mode="normal" result="shape" />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}

function SearchBar({ className }: { className?: string }) {
  return (
    <div className={className} data-name="Search Bar">
      <div className="relative shrink-0 size-[47.988px]" data-name="Icon">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 47.9885 47.9885">
          <g id="Icon">
            <path d={svgPaths.pe41f880} id="Vector" stroke="var(--stroke-0, #4A5565)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.99904" />
            <path d={svgPaths.p35373480} id="Vector_2" stroke="var(--stroke-0, #4A5565)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.99904" />
          </g>
        </svg>
      </div>
    </div>
  );
}
type ProfilecomponentProps = {
  className?: string;
  property1?: "Default" | "DJ Variant";
};

function Profilecomponent({ className, property1 = "Default" }: ProfilecomponentProps) {
  const element = (
    <div className="absolute flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[30px] justify-center leading-[0] left-[calc(50%+100.5px)] not-italic text-[24px] text-center text-white top-[calc(50%-28px)] translate-x-[-50%] translate-y-[-50%] w-[321px]">
      <p className="css-4hzbpn leading-[normal]">Lucas</p>
    </div>
  );
  const profilePicture = <div className="absolute aspect-[128/128] bg-white border-[0.3px] border-black border-solid left-0 right-0 rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.1)] top-0" data-name="Profile Picture" />;
  if (property1 === "DJ Variant") {
    return (
      <div className={className} data-name="Property 1=DJ Variant">
        <div className="absolute bg-gradient-to-b border-0 border-black border-solid from-[#4ca0f1] inset-0 rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] to-[#61c8fa]" />
        {element}
        <div className="absolute flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[43px] justify-center leading-[0] left-[calc(50%+100.5px)] not-italic text-[#2f2f2f] text-[14px] text-center top-[calc(50%+8.5px)] translate-x-[-50%] translate-y-[-50%] w-[321px]">
          <p className="css-4hzbpn leading-[normal]">DJ on SyncRequest</p>
        </div>
        <div className="absolute inset-[9.31%_63.52%_5.88%_4.44%]" data-name="ProfilePicture">
          {profilePicture}
          <div className="absolute inset-[18.63%]" data-name="Profile">
            <div className="absolute inset-[0_0_0.05%_0]" style={{ "--fill-0": "rgba(217, 217, 217, 1)", "--stroke-0": "rgba(0, 0, 0, 1)" } as React.CSSProperties}>
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 108.549 108.493">
                <g id="Profile">
                  <path d={svgPaths.p1a61c900} fill="var(--fill-0, #D9D9D9)" />
                  <path d={svgPaths.p16f7e100} fill="var(--fill-0, #D9D9D9)" />
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={className} data-name="Property 1=Default">
      <div className="absolute bg-gradient-to-b border-0 border-black border-solid from-[#77c76e] inset-0 rounded-[15px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] to-[#38997a]" />
      {element}
      <div className="absolute flex flex-col font-['Inter:Medium',sans-serif] font-medium h-[43px] justify-center leading-[0] left-[calc(50%+100.5px)] not-italic text-[#2f2f2f] text-[14px] text-center top-[calc(50%+8.5px)] translate-x-[-50%] translate-y-[-50%] w-[321px]">
        <p className="css-4hzbpn leading-[normal]">2 years following this DJ</p>
      </div>
      <div className="absolute inset-[7.84%_63.52%_7.35%_4.44%]" data-name="ProfilePicture">
        {profilePicture}
        <div className="absolute inset-[18.63%]" data-name="Profile">
          <div className="absolute inset-[0_0_0.05%_0]" style={{ "--fill-0": "rgba(217, 217, 217, 1)", "--stroke-0": "rgba(0, 0, 0, 1)" } as React.CSSProperties}>
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 108.549 108.493">
              <g id="Profile">
                <path d={svgPaths.p1a61c900} fill="var(--fill-0, #D9D9D9)" />
                <path d={svgPaths.p16f7e100} fill="var(--fill-0, #D9D9D9)" />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Group({ className }: { className?: string }) {
  return (
    <div className={className}>
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

function ThemeToggleDefault({ className }: { className?: string }) {
  return (
    <div className={className} data-name="Theme Toggle/Default">
      <Group className="h-[67px] relative shrink-0 w-full" />
    </div>
  );
}

export default function Group1() {
  return (
    <div className="h-[1080px] relative w-[1920px]">
      <div className="absolute bg-white inset-0 overflow-clip" data-name="Desktop - Login - Atendee">
        <div className="absolute bg-[#d9d9d9] h-[35px] left-0 top-0 w-[1920px]" data-name="Top Bar" />
        <ThemeToggleDefault className="absolute content-stretch flex flex-col items-start left-[1672px] shadow-[0px_4px_5px_0px_rgba(0,0,0,0.25)] top-[69px] w-[194px]" />
        <div className="absolute border-[#e5e7eb] border-solid border-t-[0.832px] h-[49px] left-1/2 top-[calc(50%+515.5px)] translate-x-[-50%] translate-y-[-50%] w-[1920px]" data-name="Container">
          <p className="absolute css-ew64yg font-['Arimo:Regular',sans-serif] font-normal leading-[24px] left-1/2 text-[#6a7282] text-[16px] text-center top-[9.82px] translate-x-[-50%]">© 2025 SyncRekwest</p>
        </div>
        <div className="absolute bg-white h-[434px] left-[93px] rounded-[14px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] top-[363px] w-[564px]" data-name="Container">
          <div className="absolute content-stretch flex gap-[15.996px] h-[108.802px] items-center left-[23.99px] pb-[0.832px] top-[23.99px] w-[516.022px]" data-name="Container">
            <div aria-hidden="true" className="absolute border-[#e5e7eb] border-b-[0.832px] border-solid inset-0 pointer-events-none" />
            <div className="bg-[#4a5565] rounded-[10px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] shrink-0 size-[55.993px]" data-name="Container" />
            <div className="flex-[1_0_0] h-[7.992px] min-h-px min-w-px relative" data-name="Container">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[11.994px] items-center relative size-full">
                <div className="bg-[#d1d5dc] h-[7.992px] rounded-[27905300px] shrink-0 w-[79.994px]" data-name="Container" />
                <div className="bg-[#d1d5dc] h-[7.992px] rounded-[27905300px] shrink-0 w-[63.998px]" data-name="Container" />
              </div>
            </div>
            <div className="h-[59.995px] relative shrink-0 w-[21.389px]" data-name="Text">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                <p className="absolute css-ew64yg font-['Arimo:Regular',sans-serif] font-normal leading-[60px] left-0 text-[#4a5565] text-[60px] top-[-5.98px]">1</p>
              </div>
            </div>
          </div>
          <div className="absolute content-stretch flex gap-[15.996px] h-[108.802px] items-center left-[23.99px] pb-[0.832px] top-[132.79px] w-[516.022px]" data-name="Container">
            <div aria-hidden="true" className="absolute border-[#e5e7eb] border-b-[0.832px] border-solid inset-0 pointer-events-none" />
            <div className="bg-[#4a5565] rounded-[10px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] shrink-0 size-[55.993px]" data-name="Container" />
            <div className="flex-[1_0_0] h-[7.992px] min-h-px min-w-px relative" data-name="Container">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[11.994px] items-center relative size-full">
                <div className="bg-[#d1d5dc] h-[7.992px] rounded-[27905300px] shrink-0 w-[79.994px]" data-name="Container" />
                <div className="bg-[#d1d5dc] h-[7.992px] rounded-[27905300px] shrink-0 w-[63.998px]" data-name="Container" />
              </div>
            </div>
            <div className="h-[59.995px] relative shrink-0 w-[30.914px]" data-name="Text">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                <p className="absolute css-ew64yg font-['Arimo:Regular',sans-serif] font-normal leading-[60px] left-0 text-[#4a5565] text-[60px] top-[-5.98px]">2</p>
              </div>
            </div>
          </div>
          <div className="absolute content-stretch flex gap-[15.996px] h-[108.802px] items-center left-[23.99px] pb-[0.832px] top-[241.59px] w-[516.022px]" data-name="Container">
            <div aria-hidden="true" className="absolute border-[#e5e7eb] border-b-[0.832px] border-solid inset-0 pointer-events-none" />
            <div className="bg-[#4a5565] rounded-[10px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] shrink-0 size-[55.993px]" data-name="Container" />
            <div className="flex-[1_0_0] h-[7.992px] min-h-px min-w-px relative" data-name="Container">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[11.994px] items-center relative size-full">
                <div className="bg-[#d1d5dc] h-[7.992px] rounded-[27905300px] shrink-0 w-[79.994px]" data-name="Container" />
                <div className="bg-[#d1d5dc] h-[7.992px] rounded-[27905300px] shrink-0 w-[63.998px]" data-name="Container" />
              </div>
            </div>
            <div className="h-[59.995px] relative shrink-0 w-[30.914px]" data-name="Text">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                <p className="absolute css-ew64yg font-['Arimo:Regular',sans-serif] font-normal leading-[60px] left-0 text-[#4a5565] text-[60px] top-[-5.98px]">3</p>
              </div>
            </div>
          </div>
          <div className="absolute content-stretch flex gap-[15.996px] h-[107.971px] items-center left-[23.99px] top-[350.39px] w-[516.022px]" data-name="Container">
            <div className="bg-[#4a5565] h-[59px] rounded-[10px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] shrink-0 w-[56px]" data-name="Container" />
            <div className="flex-[1_0_0] h-[7.992px] min-h-px min-w-px relative" data-name="Container">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[11.994px] items-center relative size-full">
                <div className="bg-[#d1d5dc] h-[7.992px] rounded-[27905300px] shrink-0 w-[79.994px]" data-name="Container" />
                <div className="bg-[#d1d5dc] h-[7.992px] rounded-[27905300px] shrink-0 w-[63.998px]" data-name="Container" />
              </div>
            </div>
            <div className="h-[59.995px] relative shrink-0 w-[31.849px]" data-name="Text">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                <p className="absolute css-ew64yg font-['Arimo:Regular',sans-serif] font-normal leading-[60px] left-0 text-[#4a5565] text-[60px] top-[-5.98px]">4</p>
              </div>
            </div>
          </div>
        </div>
        <Profilecomponent className="absolute bg-gradient-to-b from-[#77c76e] h-[204px] left-[105px] rounded-[10px] to-[#38997a] top-[125px] w-[540px]" />
        <div className="absolute content-stretch flex flex-col h-[96px] items-start left-[917px] top-[843px] w-[564px]" data-name="Container">
          <div className="bg-[#4a5565] h-[95.964px] relative rounded-[14px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] shrink-0 w-full" data-name="Button">
            <div className="flex flex-row items-center size-full">
              <div className="content-stretch flex gap-[15.996px] items-center pl-[23.988px] relative size-full">
                <div className="relative shrink-0 size-[47.988px]" data-name="Icon">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 47.9885 47.9885">
                    <g id="Icon">
                      <path d={svgPaths.p1dfb8640} id="Vector" stroke="var(--stroke-0, white)" strokeWidth="4.9988" />
                      <path d={svgPaths.p24343b00} id="Vector_2" stroke="var(--stroke-0, white)" strokeWidth="4.9988" />
                      <path d={svgPaths.pd015340} id="Vector_3" stroke="var(--stroke-0, white)" strokeWidth="4.9988" />
                      <path d={svgPaths.pd552fe0} id="Vector_4" stroke="var(--stroke-0, white)" strokeWidth="4.9988" />
                    </g>
                  </svg>
                </div>
                <div className="h-[36px] relative shrink-0 w-[423px]" data-name="Text">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                    <p className="absolute css-ew64yg font-['Arimo:Bold',sans-serif] font-bold leading-[36px] left-[calc(50%+0.03px)] text-[30px] text-center text-white top-[-3.5px] translate-x-[-50%]">Leave Party</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute content-stretch flex flex-col h-[96px] items-center justify-center left-[917px] top-[729px] w-[564px]" data-name="Container">
          <div className="bg-[#4a5565] h-[95.964px] relative rounded-[14px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] shrink-0 w-full" data-name="Button">
            <div className="flex flex-row items-center size-full">
              <div className="content-stretch flex items-center pl-[23.988px] relative size-full">
                <p className="css-4hzbpn font-['Arimo:Bold',sans-serif] font-bold h-[36px] leading-[36px] relative shrink-0 text-[30px] text-center text-white w-[515px]">Queue Song</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute contents left-[1521px] top-[773px]" data-name="Iconos Ajustes">
          <div className="absolute bg-[#4a5565] left-[1521px] rounded-[15px] size-[128px] top-[773px]" data-name="Ajustes Rectangulo" />
          <div className="absolute bottom-[19.03%] left-[calc(50%+625.24px)] top-[74.07%] translate-x-[-50%] w-[74.473px]" data-name="Ajustes">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 74.4727 74.4727">
              <path clipRule="evenodd" d={svgPaths.p24f74600} fill="var(--fill-0, white)" fillRule="evenodd" id="Ajustes" />
            </svg>
          </div>
        </div>
        <SearchBar className="absolute bg-white bottom-[71.94%] content-stretch flex items-center left-[calc(50%+312px)] px-[23.988px] rounded-[14px] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] top-[20.65%] translate-x-[-50%] w-[920px]" />
        <Rating className="absolute left-[244px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-[128px] top-[845px]" />
        <Rating className="absolute left-[405px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)] size-[128px] top-[845px]" property1="Thumbs Down" />
      </div>
    </div>
  );
}