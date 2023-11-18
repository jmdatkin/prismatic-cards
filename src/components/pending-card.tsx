import localFont from 'next/font/local';
import styles from '@/styles/Card.module.css';
import { Libre_Baskerville } from 'next/font/google';
import { CardRarity } from '@/types/card-rarity';
import Image from 'next/image';
import LoadingSpinner from './loading-spinner';

// type CardProps = {
//     // info: string,
//     value: ,
// };

const libreBaskerville = Libre_Baskerville({ weight: ["400", "700"], subsets: ["latin"] });

const rarityMap: any = {
    [CardRarity.Bronze]: styles.cardBronze,
    [CardRarity.Silver]: styles.cardSilver,
    [CardRarity.Gold]: styles.cardGold,
    [CardRarity.Prismatic]: styles.cardPrismatic
};

function PendingCard(props: any) {

    return (
        <div className={`${styles.card} after:w-full after:h-full after:bg-[rgba(0,0,0,0.7)] after:absolute z-[100] flex flex-col justify-center items-center w-[300px] h-[500px] bg-zinc-950 text-zinc-50 rounded relative`}>
            <LoadingSpinner size={64}></LoadingSpinner>
        </div>
    );
}

export default PendingCard;