import React, { useState, useEffect } from 'react';
import itemsData from './data/items.json';
import placeData from './data/place_special_items.json';
import './App.css';

function App() {
  const INITIAL_MONEY = 3000;
  const params = new URLSearchParams(window.location.search);
  const placeName = params.get('place') || 'バウ';
  const isBlackMarket = params.get('black') === '1';

  const placeInfo = placeData.find(p => p.地名 === placeName);
  const placeType = placeInfo?.分類 || '村';
  const specialBuy = placeInfo?.特産品 || null;
  const specialSell = placeInfo?.希少品 || null;

  const [money, setMoney] = useState(() => Number(localStorage.getItem('playerMoney')) || INITIAL_MONEY);
  const [buyQuantities, setBuyQuantities] = useState({});
  const [sellQuantities, setSellQuantities] = useState({});
  const [finalBuyList, setFinalBuyList] = useState([]);
  const [finalSellList, setFinalSellList] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  const areaMultiplier = { '村': 1.0, '町': 1.3, '市': 1.6 };
  const itemLimit = { '村': 5, '町': 10, '市': 20 }[placeType] || 8;

  useEffect(() => {
    const categoryPool = Object.keys(itemsData); // items.jsonのカテゴリーキーを取得
    let newSelectedCategories = [];

    // カテゴリー変更を確認する
    const changeCategoryThreshold = 5; // 5回に1回カテゴリー変更
    const previousCategoryChangeCount = Number(localStorage.getItem('categoryChangeCount') || 0);
    const newCategoryChangeCount = (previousCategoryChangeCount + 1) % changeCategoryThreshold;

    // 5回に1回カテゴリーをランダムに選んで更新
    if (newCategoryChangeCount === 0) {
      // 地名によって選べるカテゴリー数を決定
      const availableCategoriesCount = { '村': 1, '町': 2, '市': 3 }[placeType] || 1;
      newSelectedCategories = [];

      // ランダムにカテゴリーを選ぶ
      while (newSelectedCategories.length < availableCategoriesCount) {
        const randomCategory = categoryPool[Math.floor(Math.random() * categoryPool.length)];
        if (!newSelectedCategories.includes(randomCategory)) {
          newSelectedCategories.push(randomCategory);
        }
      }

      // 選ばれたカテゴリーをローカルストレージに保存
      localStorage.setItem('selectedCategories', JSON.stringify(newSelectedCategories));
    }

    // カテゴリー変更カウントを更新
    localStorage.setItem('categoryChangeCount', newCategoryChangeCount.toString());

    // 既に選ばれたカテゴリーを取得
    setSelectedCategories(JSON.parse(localStorage.getItem('selectedCategories')) || []);
  }, [placeType]);

  useEffect(() => {
    const categoryItems = [];
    selectedCategories.forEach(category => {
      if (itemsData[category]) {
        const itemsInCategory = Object.entries(itemsData[category]).map(([itemName, price]) => ({
          itemName,
          price,
          category,
        }));
        categoryItems.push(...itemsInCategory);
      }
    });

    // ランダムで選ばれたカテゴリーに基づいてアイテムリストを作成
    const shuffledItems = categoryItems.sort(() => 0.5 - Math.random());
    const finalItems = shuffledItems.slice(0, itemLimit); // アイテム数を制限

    setFinalBuyList(finalItems);
    setFinalSellList(finalItems);
  }, [selectedCategories, itemLimit]);

  useEffect(() => {
    localStorage.setItem('playerMoney', money);
  }, [money]);

  const handleBuy = (item, quantity) => {
    const totalCost = item.price * quantity;
    if (quantity <= 0) return alert("数量を正しく入力してください。");
    if (money >= totalCost) {
      setMoney(money - totalCost);
      alert(`${item.itemName} を ${quantity}個 購入！（-${totalCost}G）`);
    } else {
      alert("お金が足りません！");
    }
  };

  const handleSell = (item, quantity) => {
    if (quantity <= 0) return alert("数量を正しく入力してください。");
    let totalGain = item.price * quantity;
    if (isBlackMarket) {
      totalGain = Math.round(totalGain * 1.5);
    }
    setMoney(money + totalGain);
    alert(`${item.itemName} を ${quantity}個 売却！（+${totalGain}G）`);
  };

  const handleResetMoney = () => {
    setMoney(INITIAL_MONEY);
    alert("所持金をリセットしました！（3000G）");
  };

  return (
    <div className="App" style={{ fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>行商ボードゲーム {isBlackMarket ? '闇市場' : '売買画面'}</h1>
      <h2>
        現在地: {isBlackMarket ? '？？？（分類: 路地裏）' : `${placeName}（分類: ${placeType}）`}
      </h2>

      {specialBuy && !isBlackMarket && <p style={{ color: 'green' }}>🌟 特産品: {specialBuy}</p>}
      {specialSell && !isBlackMarket && <p style={{ color: 'red' }}>💎 希少品: {specialSell}</p>}
      <p style={{fontSize: '24px', border: '2px solid gold', padding: '10px', borderRadius: '8px', display: 'inline-block', background: '#fffbe6'}}>💴 所持金：{money} G</p>

      <div style={{ marginTop: '8px' }}>
        <input
          type="number"
          value={money}
          onChange={e => setMoney(Number(e.target.value))}
          style={{ width: '120px', padding: '5px', fontSize: '16px', marginRight: '8px' }}
        />
        <span>G に設定</span>
      </div>

      <div style={{ marginTop: '10px' }}>
        <button onClick={handleResetMoney} style={{background: '#444', color: '#fff', padding: '8px 16px', borderRadius: '5px'}}>所持金リセット（3000Gに戻す）</button>
      </div>

      <h2>購入できるアイテム</h2>
      <div style={{ display: 'grid', gap: '10px' }}>
        {finalBuyList.map((item, index) => (
          <div key={index} style={{border: '2px solid #ccc', padding: '10px', borderRadius: '8px', background: '#f9f9f9'}}>
            <strong>{item.itemName}</strong> ({item.category}) - {item.price}G /個
            <div>
              <input type="number" min="1" value={buyQuantities[item.itemName] || ''} onChange={e => setBuyQuantities({...buyQuantities, [item.itemName]: e.target.value})} style={{ width: '50px', margin: '5px' }} /> 個
              <button onClick={() => handleBuy(item, Number(buyQuantities[item.itemName]))} style={{ background: '#4caf50', color: '#fff', padding: '5px 10px', borderRadius: '5px' }}>購入</button>
            </div>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: '20px' }}>売却できるアイテム</h2>
      <div style={{ display: 'grid', gap: '10px' }}>
        {finalSellList.map((item, index) => (
          <div key={index} style={{border: '2px solid #ccc', padding: '10px', borderRadius: '8px', background: '#f9f9f9'}}>
            <strong>{item.itemName}</strong> ({item.category}) - {item.price}G /個
            <div>
              <input type="number" min="1" value={sellQuantities[item.itemName] || ''} onChange={e => setSellQuantities({...sellQuantities, [item.itemName]: e.target.value})} style={{ width: '50px', margin: '5px' }} /> 個
              <button onClick={() => handleSell(item, Number(sellQuantities[item.itemName]))} style={{ background: '#e53935', color: '#fff', padding: '5px 10px', borderRadius: '5px' }}>売却</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
