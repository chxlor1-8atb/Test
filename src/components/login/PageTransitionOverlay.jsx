import React from "react";
import Image from "next/image";

export const PageTransitionOverlay = ({ success }) => (
  <div className={`page-transition ${success ? "active success" : ""}`}>
    <div className="page-transition__bg"></div>
    <div className="page-transition__content">
      <div className="page-transition__logo">
        <Image
          src="/image/shop-logo.png"
          alt="Shop License"
          width={80}
          height={80}
          priority
        />
      </div>
      <div className="page-transition__spinner"></div>
      <div className="page-transition__success">
        <i className="fas fa-check"></i>
      </div>
      <div className="page-transition__text">
        {success ? "เข้าสู่ระบบสำเร็จ!" : "กำลังเข้าสู่ระบบ..."}
      </div>
    </div>
  </div>
);
