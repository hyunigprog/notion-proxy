import { Client } from '@notionhq/client';
import { Request, Response } from 'express';

const notionClient = new Client({
  auth: process.env.NOTION_API_KEY,
});

const notionDatabaseId = process.env.NOTION_DATABASE_ID || '';

export default async function handler(req: Request, res: Response) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // OPTIONS 메소드에 대한 사전 처리
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
    console.error('Notion API 키 또는 데이터베이스 ID가 환경 변수에 설정되지 않았습니다.');
    res.status(500).json({ error: '서버 설정에 오류가 있습니다.' });
    return;
  }

  try {
    const notionResponse = await notionClient.databases.query({
      database_id: notionDatabaseId,
    });

    // Notion API 응답을 프론트엔드에서 사용하기 좋은 형태로 가공합니다.
    const formattedData = notionResponse.results.map((page: any) => {
      const p = page.properties;
      return {
        id: page.id,
        harvestMonth: p['📅 수확 월']?.date?.start || null,
        dividendSource: p['🏧 배당 출처']?.rich_text[0]?.plain_text || null,
        harvestedDividend: p['💵 수확한 배당금(USD)']?.number || null,
        reinvestTicker: p['🎯 재투자 종목']?.rich_text[0]?.plain_text || null,
        buyPrice: p['🛒 매수 단가(USD)']?.number || null,
        buyQuantity: p['📈 매수 수량']?.number || null,
        remainingCash: p['💰 남은 달러 현금']?.number || null,
        totalQqqm: p['🚀 누적 QQQM 수량']?.number || null,
        totalSchd: p['누적 SCHD 수량']?.number || null,
      };
    });

    res.status(200).json(formattedData);

  } catch (error) {
    console.error('Notion 데이터 조회 중 오류 발생:', error);
    res.status(500).json({ error: 'Notion에서 데이터를 가져오는 데 실패했습니다.' });
  }
}
