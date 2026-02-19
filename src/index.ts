import Reveal from "reveal.js";
import RevealMarkdown from "reveal.js/plugin/markdown/markdown";

const namespaces = { d: "DAV:" };

const namespaceResolver: XPathNSResolver = (prefix: string | null) =>
  // @ts-ignore
  namespaces[prefix] || null;

export default class DigitalSignage {
  private _timeSlide = 15 * 1000;
  private _timeReload = 60 * 60 * 1000;

  private _dataUrl: string;
  private _container: HTMLElement;

  constructor(caldavUrl: string, container: HTMLElement) {
    this._dataUrl = caldavUrl;
    this._container = container;
    this._loadSlides();
    setInterval(() => this._loadSlides(), this._timeReload);
  }

  private _initReveal() {
    if (Reveal.isReady()) {
      Reveal.destroy();
    }
    Reveal.initialize({
      autoPlayMedia: true,
      autoSlide: this._timeSlide,
      autoSlideStoppable: false,
      controls: false,
      loop: true,
      plugins: [RevealMarkdown],
      preloadIframes: true,
      progress: false,
      slideNumber: "c/t",
    });
  }

  private _loadSlides() {
    fetch(this._dataUrl, {
      method: "PROPFIND",
      headers: { depth: "1" },
      body: `<d:propfind xmlns:d="DAV:"><d:prop><d:getcontenttype /></d:prop></d:propfind>`,
    })
      .then((response) => response.text())
      .then((text) => {
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        const iter = xml.evaluate(
          "/d:multistatus/d:response/d:propstat/d:prop/d:getcontenttype",
          xml,
          namespaceResolver,
          XPathResult.UNORDERED_NODE_ITERATOR_TYPE,
        );

        this._container.textContent = "";

        // loop over all files
        let node: Node | null;
        while ((node = iter.iterateNext())) {
          const type = node.textContent;
          const href =
            node.parentNode?.parentNode?.parentNode?.querySelector(
              "href",
            )?.textContent;
          if (!type || !href) continue;
          const url = new URL(href, this._dataUrl).href;
          this._addSlide(type, url);
        }

        this._initReveal();
      });
  }

  private _addSlide(type: string, href: string) {
    const slide = document.createElement("section");

    // image
    if (["image/jpeg", "image/png"].includes(type)) {
      this._container.appendChild(slide);
      slide.dataset.backgroundImage = href;
      slide.dataset.backgroundSize = "contain";
    }

    // markdown
    else if (["text/markdown"].includes(type)) {
      this._container.appendChild(slide);
      slide.dataset.markdown = href;
    }

    // url
    else if (["application/internet-shortcut"].includes(type)) {
      fetch(href)
        .then((response) => response.text())
        .then((text) => {
          this._container.appendChild(slide);
          slide.dataset.backgroundIframe = text;
        });
    }
  }
}
