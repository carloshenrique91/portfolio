(function ($) {
  "use strict";

  function setActiveLink($links, $link) {
    $links.removeClass("active").removeAttr("aria-current");
    $link.addClass("active").attr("aria-current", "page");
  }

  $(function () {
    var $year = $("#year");
    if ($year.length) {
      $year.text(new Date().getFullYear());
    }

    var $menuButton = $(".btn_menu_mobile");
    var $menuLinks = $("#main_menu > ul").find("a");

    function setMenuOpen(open) {
      $menuButton.toggleClass("active", open);
      $menuButton.attr("aria-expanded", open ? "true" : "false");
      $menuButton.attr("aria-label", open ? "Fechar menu" : "Abrir menu");
      $menuButton.find(".material-symbols-outlined").text(open ? "close" : "menu");
    }

    setMenuOpen($menuButton.hasClass("active"));

    var $initialActive = $menuLinks.filter(".active").first();
    if ($initialActive.length) {
      $initialActive.attr("aria-current", "page");
    }

    $menuButton.on("click", function () {
      setMenuOpen(!$(this).hasClass("active"));
    });

    $(document).on("keydown", function (e) {
      if (e.key === "Escape" && $menuButton.hasClass("active")) {
        setMenuOpen(false);
      }
    });

    $menuLinks.on("click", function () {
      var $link = $(this);
      setActiveLink($menuLinks, $link);

      if ($menuButton.hasClass("active")) {
        setMenuOpen(false);
      }
    });

    var $home = $("#home");
    var homeEl = $home.get(0);
    var reduceMotion =
      window.matchMedia &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var scrollWatcherEl = document.getElementById("scroll_watcher");
    var supportsScrollTimeline =
      window.CSS &&
      typeof window.CSS.supports === "function" &&
      window.CSS.supports("animation-timeline: scroll()");

    function updateHomeParallax(scrollTop) {
      if (!homeEl || reduceMotion) return;

      var speed = 0.7;
      var maxShift = Math.round(window.innerHeight * 1.0);
      var y = -Math.min(scrollTop * speed, maxShift);

      homeEl.style.setProperty("--home-parallax-y", Math.round(y) + "px");
    }

    function updateScrollWatcher(scrollTop) {
      if (!scrollWatcherEl || supportsScrollTimeline) return;

      var doc = document.documentElement;
      var max = (doc && doc.scrollHeight ? doc.scrollHeight : 0) - window.innerHeight;
      var progress = max > 0 ? scrollTop / max : 0;
      progress = Math.max(0, Math.min(1, progress));

      scrollWatcherEl.style.transform = "scaleX(" + progress.toFixed(4) + ")";
    }

    updateHomeParallax($(window).scrollTop() || 0);
    updateScrollWatcher($(window).scrollTop() || 0);

    $(window).on("resize", function () {
      updateHomeParallax($(window).scrollTop() || 0);
      updateScrollWatcher($(window).scrollTop() || 0);
    });

    var ticking = false;
    $(window).on("scroll", function () {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(function () {
        ticking = false;

        var scrollTop = $(window).scrollTop() || 0;
        updateHomeParallax(scrollTop);
        updateScrollWatcher(scrollTop);

        $("#main_container > .block").each(function () {
          var $block = $(this);
          var top = $block.offset().top;
          var height = $block.outerHeight();

          if (scrollTop >= top && scrollTop < top + height) {
            var id = $block.attr("id");
            var $link = $menuLinks.filter('[href="#' + id + '"]').first();

            if ($link.length && !$link.hasClass("active")) {
              setActiveLink($menuLinks, $link);
            }
            return false;
          }
        });
      });
    });

    $(".list > li").each(function () {
      var card = this;
      var $card = $(card);
      var $img = $card.find("img").first();

      if (!$img.length) return;

      var rafId = null;
      var lastClientX = 0;
      var lastClientY = 0;

      function applyParallax() {
        rafId = null;

        var rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        var x = (lastClientX - rect.left) / rect.width;
        var y = (lastClientY - rect.top) / rect.height;

        x = Math.max(0, Math.min(1, x));
        y = Math.max(0, Math.min(1, y));

        var moveX = (0.5 - x) * 6;
        var moveY = (0.5 - y) * 6;

        $img.css({
          transition: "none",
          transform:
            "scale(.6) translate(" +
            moveX.toFixed(2) +
            "%, " +
            moveY.toFixed(2) +
            "%)",
        });
      }

      $card
        .on("mousemove", function (event) {
          lastClientX = event.clientX;
          lastClientY = event.clientY;
          if (!rafId) {
            rafId = window.requestAnimationFrame(applyParallax);
          }
        })
        .on("mouseleave", function () {
          if (rafId) {
            window.cancelAnimationFrame(rafId);
            rafId = null;
          }
          $img.removeAttr("style");
        });
    });

    var $portfolioCards = $("#portfolio .list > li");
    if ($portfolioCards.length) {
      function escapeHtml(value) {
        return (value || "")
          .toString()
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function getProjectGallery($card, title) {
        var rawGallery = ($card.attr("data-gallery") || "").toString().trim();
        var images = [];

        if (rawGallery) {
          images = rawGallery.split("|");
        } else {
          var cardImage = ($card.find("img").first().attr("src") || "").toString().trim();
          images = [cardImage];
        }

        var cleaned = [];
        var seen = {};

        images.forEach(function (src) {
          var cleanSrc = (src || "").toString().trim();
          if (!cleanSrc || seen[cleanSrc]) return;
          seen[cleanSrc] = true;
          cleaned.push(cleanSrc);
        });

        if (!cleaned.length) {
          cleaned.push("static/img/others/project.svg");
        }

        return cleaned.map(function (src, index) {
          return {
            src: src,
            alt: title + " - imagem " + (index + 1),
          };
        });
      }

      function getProjectLinks($card) {
        var rawLinks = ($card.attr("data-links") || "").toString().trim();
        var links = [];
        var seen = {};

        if (!rawLinks) {
          return links;
        }

        rawLinks.split("|").forEach(function (entry) {
          var value = (entry || "").toString().trim();
          if (!value) return;

          var parts = value.split("::");
          var label = "";
          var href = "";

          if (parts.length > 1) {
            label = (parts.shift() || "").toString().trim();
            href = parts.join("::").toString().trim();
          } else {
            href = parts[0].toString().trim();
          }

          if (!href) return;
          if (!label) {
            label = "Abrir link";
          }

          var key = (label + "|" + href).toLowerCase();
          if (seen[key]) return;
          seen[key] = true;

          links.push({
            label: label,
            href: href,
          });
        });

        return links;
      }

      function buildProjectModalHtml(description, gallery, links) {
        var html = '<div class="swal-project-modal">';
        html += '<p class="swal-project-description">' + escapeHtml(description) + "</p>";

        if (links.length) {
          html += '<div class="swal-project-links" aria-label="Links do projeto">';
          links.forEach(function (link) {
            html +=
              '<a class="swal-project-link" href="' +
              escapeHtml(link.href) +
              '" target="_blank" rel="noopener noreferrer">' +
              escapeHtml(link.label) +
              "</a>";
          });
          html += "</div>";
        }

        html += '<div class="swal-project-carousel" data-index="0">';
        html += '<div class="swal-project-track">';

        gallery.forEach(function (image, index) {
          html +=
            '<figure class="swal-project-slide" data-slide="' +
            index +
            '" aria-hidden="' +
            (index === 0 ? "false" : "true") +
            '">';
          html +=
            '<img src="' +
            escapeHtml(image.src) +
            '" alt="' +
            escapeHtml(image.alt) +
            '" loading="lazy" decoding="async">';
          html += "</figure>";
        });

        html += "</div>";

        if (gallery.length > 1) {
          html +=
            '<button type="button" class="swal-project-nav prev" data-direction="-1" aria-label="Imagem anterior">&lt;</button>';
          html +=
            '<button type="button" class="swal-project-nav next" data-direction="1" aria-label="Próxima imagem">&gt;</button>';
          html += '<div class="swal-project-dots" role="tablist" aria-label="Navegação do carrossel">';

          gallery.forEach(function (_image, index) {
            html +=
              '<button type="button" class="swal-project-dot' +
              (index === 0 ? " is-active" : "") +
              '" data-index="' +
              index +
              '" aria-label="Ir para imagem ' +
              (index + 1) +
              '" aria-current="' +
              (index === 0 ? "true" : "false") +
              '"></button>';
          });

          html += "</div>";
        }

        html += "</div>";
        html += "</div>";

        return html;
      }

      function setupProjectCarousel(popupEl) {
        var carousel = popupEl.querySelector(".swal-project-carousel");
        if (!carousel) return;

        var track = carousel.querySelector(".swal-project-track");
        var slides = carousel.querySelectorAll(".swal-project-slide");
        var dots = carousel.querySelectorAll(".swal-project-dot");
        var total = slides.length;

        if (!track || !total) return;

        var currentIndex = 0;

        function goTo(index) {
          currentIndex = ((index % total) + total) % total;
          track.style.transform = "translateX(-" + currentIndex * 100 + "%)";
          carousel.setAttribute("data-index", currentIndex);

          slides.forEach(function (slide, slideIndex) {
            slide.setAttribute("aria-hidden", slideIndex === currentIndex ? "false" : "true");
          });

          dots.forEach(function (dot, dotIndex) {
            var active = dotIndex === currentIndex;
            dot.classList.toggle("is-active", active);
            dot.setAttribute("aria-current", active ? "true" : "false");
          });
        }

        carousel.addEventListener("click", function (event) {
          var target = event.target;
          if (!target || typeof target.closest !== "function") {
            return;
          }

          var navButton = target.closest(".swal-project-nav");
          var dotButton = target.closest(".swal-project-dot");

          if (navButton) {
            var direction = parseInt(navButton.getAttribute("data-direction"), 10) || 0;
            goTo(currentIndex + direction);
            return;
          }

          if (dotButton) {
            var index = parseInt(dotButton.getAttribute("data-index"), 10);
            if (!Number.isNaN(index)) {
              goTo(index);
            }
          }
        });

        popupEl.addEventListener("keydown", function (event) {
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            goTo(currentIndex - 1);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            goTo(currentIndex + 1);
          }
        });

        goTo(0);
      }

      function openProjectModal(card) {
        if (!window.Swal || typeof window.Swal.fire !== "function") {
          return;
        }

        var $card = $(card);
        var title = ($card.find("h3").first().text() || "").replace(/\s+/g, " ").trim() || "Projeto";
        var description = ($card.find("p").first().text() || "").replace(/\s+/g, " ").trim();
        var gallery = getProjectGallery($card, title);
        var links = getProjectLinks($card);

        window.Swal.fire({
          title: title,
          html: buildProjectModalHtml(description, gallery, links),
          confirmButtonText: "Fechar",
          showCloseButton: true,
          focusConfirm: false,
          buttonsStyling: false,
          customClass: {
            popup: "swal-theme-popup swal-project-popup",
            title: "swal-theme-title",
            htmlContainer: "swal-theme-content",
            confirmButton: "swal-theme-confirm",
            closeButton: "swal-theme-close",
          },
          backdrop: "rgba(0, 0, 0, 0.85)",
          didOpen: function (popup) {
            setupProjectCarousel(popup);
          },
        });
      }

      $portfolioCards.each(function () {
        var $card = $(this);
        var projectName = ($card.find("h3").first().text() || "").replace(/\s+/g, " ").trim();
        if (projectName) {
          $card.attr("aria-label", "Abrir detalhes do projeto " + projectName);
        }
        $card.attr({
          role: "button",
          tabindex: "0",
        });
      });

      $portfolioCards.on("click", function () {
        openProjectModal(this);
      });

      $portfolioCards.on("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openProjectModal(this);
        }
      });
    }

    var $contactForm = $("#contact-form");
    if ($contactForm.length) {
      function setContactStatus($status, message, tone) {
        $status.removeClass("is-info is-success is-error");
        if (tone) {
          $status.addClass("is-" + tone);
        }
        $status.text(message || "");
      }

      function showContactAlert(icon, title, text) {
        if (!window.Swal || typeof window.Swal.fire !== "function") {
          return;
        }

        window.Swal.fire({
          icon: icon,
          title: title,
          text: text,
          confirmButtonText: "OK",
          buttonsStyling: false,
          customClass: {
            popup: "swal-theme-popup",
            title: "swal-theme-title",
            htmlContainer: "swal-theme-content",
            confirmButton: "swal-theme-confirm",
          },
          backdrop: "rgba(0, 0, 0, 0.8)",
        });
      }

      $contactForm.on("submit", function (e) {
        e.preventDefault();

        var form = this;
        var $form = $(form);
        var $submit = $form.find('button[type="submit"]').first();
        var $status = $("#contact-status");

        setContactStatus($status, "", "");

        if (typeof form.checkValidity === "function" && !form.checkValidity()) {
          if (typeof form.reportValidity === "function") {
            form.reportValidity();
          }
          setContactStatus($status, "Revise os campos obrigatórios antes de enviar.", "error");
          showContactAlert("error", "Formulário incompleto", "Preencha os campos obrigatórios para continuar.");
          return;
        }

        var honey = ($form.find("#website").val() || "").trim();
        if (honey) {
          setContactStatus($status, "", "");
          return;
        }

        var phone = ($form.data("whatsapp") || "").toString().trim();
        if (!phone) {
          setContactStatus($status, "Configuração ausente: número do WhatsApp.", "error");
          showContactAlert("error", "Configuração ausente", "Número de WhatsApp não encontrado.");
          return;
        }

        var name = ($form.find("#clientName").val() || "").toString().trim();
        var email = ($form.find("#clientEmail").val() || "").toString().trim();
        var message = ($form.find("#clientText").val() || "").toString().trim();

        var text =
          "Olá! Meu nome é " +
          name +
          ".\n" +
          "E-mail: " +
          email +
          "\n\n" +
          message;

        var url =
          "https://api.whatsapp.com/send?phone=" +
          encodeURIComponent(phone) +
          "&text=" +
          encodeURIComponent(text);

        $submit.prop("disabled", true).attr("aria-busy", "true");
        setContactStatus($status, "Abrindo o WhatsApp...", "info");

        var popup = window.open(url, "_blank", "noopener,noreferrer");
        if (popup) {
          form.reset();
          setContactStatus(
            $status,
            "WhatsApp aberto. Se não aparecer, verifique o bloqueador de pop-ups.",
            "success"
          );
          showContactAlert(
            "success",
            "Mensagem pronta",
            "O WhatsApp foi aberto com sua mensagem preenchida."
          );

          window.setTimeout(function () {
            $submit.prop("disabled", false).removeAttr("aria-busy");
          }, 1200);
        } else {
          setContactStatus($status, "Redirecionando para o WhatsApp...", "info");
          showContactAlert("info", "Redirecionando", "Abrindo o WhatsApp na mesma aba.");
          $submit.prop("disabled", false).removeAttr("aria-busy");
          window.location.href = url;
        }
      });
    }
  });
})(jQuery);
