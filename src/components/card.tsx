import localFont from 'next/font/local';
import styles from '@/styles/Card.module.css';
import { Libre_Baskerville } from 'next/font/google';
import { CardRarity } from '@/types/card-rarity';
import Image from 'next/image';

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

function Card(props: any) {

    return (
        <div className={`${libreBaskerville.className} ${styles.card}  z-[100] flex flex-col justify-between w-[300px] h-[500px] bg-zinc-950 text-zinc-50 rounded relative`}>
            <div className={`${styles.attack} z-[200]`}>{props.value.attack}</div>
            <div className={`${styles.defense} z-[200]`}>{props.value.defense}</div>
            <div className={`${styles.cardTitle} ${rarityMap[props.value.rarity]}`}>
                <h4 className="text-lg uppercase font-bold text-center">{props.value.title}</h4>
            </div>
            <div className="text-sm overflow-hidden flex-grow text-ellipsis p-4">
                {props.value.description != "" ?
                    <p>{props.value.description}</p> :
                    <p className="italic text-zinc-500">No description ..</p>
                }
            </div>
            <div className="h-1/2 relative">
                {/* <img className="object-cover" src={props.value.image}></img> */}
                <Image alt="" fill={true} className="object-cover" loading='lazy' src={props.value.imageUrl}></Image>
            </div>
        </div>
    );
}

export default Card;