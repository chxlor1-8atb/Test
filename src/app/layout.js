export const metadata = {
    title: 'ระบบจัดการใบอนุญาตร้านค้า',
    description: 'Shop License Management System',
};

export default function RootLayout({ children }) {
    return (
        <html lang="th">
            <body>{children}</body>
        </html>
    );
}
